import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import net.sourceforge.argparse4j.ArgumentParsers;
import net.sourceforge.argparse4j.helper.HelpScreenException;
import net.sourceforge.argparse4j.inf.ArgumentParserException;
import net.sourceforge.argparse4j.inf.Namespace;
import objects.Error;
import objects.Message;
import objects.Refactoring;
import org.eclipse.jgit.annotations.Nullable;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

public class Server {
    private static final ObjectMapper mapper = new ObjectMapper();

    private static Namespace parseArgs(String[] args) throws ArgumentParserException {
        var parser = ArgumentParsers.newFor("refdiff").build();
        parser.description("Run RefDiff HTTP server.");
        parser.addArgument("-p", "--port")
                .help("Port to serve (default: 3000).")
                .type(Integer.class)
                .metavar("port")
                .setDefault(3000);

        try {
            return parser.parseArgs(args);
        } catch (HelpScreenException e) {
            System.exit(0);
            return null;
        }
    }

    private static Map<String, String> decodeQuery(String rawParam) {
        var utf8 = StandardCharsets.UTF_8;
        var q = new HashMap<String, String>();
        for (String raw : rawParam.split("&")) {
            var split = raw.split("=");
            if (split.length < 2) {
                q.put(URLDecoder.decode(split[0], utf8), "");
            } else {
                q.put(URLDecoder.decode(split[0], utf8), URLDecoder.decode(split[1], utf8));
            }
        }
        return q;
    }

    private static String randomID(int len) {
        var rand = new Random();
        return rand.ints('a', 'z' + 1)
                .limit(len)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    static class DetectHandler implements HttpHandler {
        private static final Pattern commitPattern = Pattern.compile("^[0-9a-f]{40}$");

        private static void respondJSON(HttpExchange ex, int status, Object val) throws IOException {
            respondRaw(ex, status, mapper.writeValueAsBytes(val));
        }

        private static void respondRaw(HttpExchange ex, int status, byte[] response) throws IOException {
            var h = ex.getResponseHeaders();
            h.add("Content-Type", "application/json");
            ex.sendResponseHeaders(status, response.length);
            var body = ex.getResponseBody();
            body.write(response);
            body.flush();
            body.close();
        }

        @Nullable
        private List<Refactoring> run(String dir, String commit, String language, int timeout) throws Exception {
            File tmpDir = new File("/tmp/" + randomID(8));

            var runner = new RefDiffRunner(dir, tmpDir, commit, language);
            var limiter = new TimeLimiter(runner, Duration.ofSeconds(timeout));

            try {
                limiter.run();
            } finally {
                var rm = new ProcessBuilder("rm", "-rf", tmpDir.getAbsolutePath()).start();
                int rmExit = rm.waitFor();
                if (rmExit != 0) {
                    System.out.println("Failed to delete tmp dir " + tmpDir.getAbsolutePath());
                }
            }

            return runner.getRefactorings();
        }

        private void process(HttpExchange ex) throws Exception {
            var q = decodeQuery(ex.getRequestURI().getRawQuery());
            if (!q.containsKey("dir")) {
                respondJSON(ex, 400, new Message("dir parameter not found"));
                return;
            }
            if (!q.containsKey("commit")) {
                respondJSON(ex, 400, new Message("commit parameter not found"));
                return;
            }
            if (!q.containsKey("timeout")) {
                respondJSON(ex, 400, new Message("timeout parameter not found"));
                return;
            }

            var dir = q.get("dir");
            var commit = q.get("commit");
            if (!commitPattern.matcher(commit).matches()) {
                respondJSON(ex, 400, new Message("malformed commit format"));
                return;
            }
            int timeout;
            try {
                timeout = Integer.parseInt(q.get("timeout"));
            } catch (Exception e) {
                respondJSON(ex, 400, new Message("timeout needs to be an integer"));
                return;
            }
            if (timeout <= 0) {
                respondJSON(ex, 400, new Message("timeout needs to be a positive integer"));
                return;
            }
            var language = q.getOrDefault("language", "java");

            List<Refactoring> refs = this.run(dir, commit, language, timeout);
            if (refs == null) {
                respondJSON(ex, 500, new Message("timed out"));
                return;
            }

            respondJSON(ex, 200, refs);
        }

        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                this.process(ex);
            } catch (Exception e) {
                e.printStackTrace();
                respondJSON(ex, 500, new Error("internal server error", e.getMessage()));
            } finally {
                System.gc(); // aggressive gc
            }
        }
    }

    public static void serve(String[] args) throws ArgumentParserException {
        var ns = parseArgs(args);
        int port = ns.getInt("port");
        try {
            var addr = new InetSocketAddress("0.0.0.0", port);
            var server = HttpServer.create(addr, 10);
            server.createContext("/detect", new DetectHandler());
            var pool = new ThreadPoolExecutor(
                    4, 8, 60, TimeUnit.SECONDS,
                    new ArrayBlockingQueue<>(100));
            server.setExecutor(pool);
            server.start();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        System.out.printf("Listening at port %d...\n", port);
    }
}
