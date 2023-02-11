import com.fasterxml.jackson.databind.ObjectMapper;
import net.sourceforge.argparse4j.ArgumentParsers;
import net.sourceforge.argparse4j.helper.HelpScreenException;
import net.sourceforge.argparse4j.impl.Arguments;
import net.sourceforge.argparse4j.inf.ArgumentParserException;
import net.sourceforge.argparse4j.inf.Namespace;
import objects.Commit;
import org.eclipse.jgit.annotations.Nullable;
import refdiff.parsers.LanguagePlugin;
import refdiff.parsers.c.CPlugin;
import refdiff.parsers.java.JavaPlugin;
import refdiff.parsers.js.JsPlugin;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class CLI {
    private static Namespace parseArgs(String[] args) throws ArgumentParserException {
        var parser = ArgumentParsers.newFor("refdiff").build();
        parser.description("Run RefDiff for given repository.");
        parser.addArgument("-r", "--repository")
                .help("Path to the repository (e.g. /work/gradle/.git)")
                .type(String.class)
                .metavar("path")
                .required(true);
        parser.addArgument("-o", "--out")
                .help("Path to the output json file")
                .type(String.class)
                .metavar("path")
                .required(true);
        parser.addArgument("-p", "--pretty")
                .help("Pretty print json")
                .action(Arguments.storeTrue())
                .type(Boolean.class)
                .setDefault(false);
        parser.addArgument("-l", "--language")
                .help("Target language")
                .type(String.class)
                .choices("java", "js", "c")
                .setDefault("java");
        parser.addArgument("--start")
                .help("Git object ref for starting commit (example: HEAD)")
                .type(String.class)
                .metavar("ref")
                .setDefault("HEAD");
        parser.addArgument("--end")
                .help("Git object ref for ending commit (inclusive, example: HEAD)")
                .type(String.class)
                .metavar("ref");
        parser.addArgument("--depth")
                .help("Number of commits to navigate backwards")
                .type(Integer.class)
                .metavar("N")
                .setDefault(1);

        try {
            return parser.parseArgs(args);
        } catch (HelpScreenException e) {
            System.exit(0);
            return null;
        }
    }

    private static List<Commit> runRefDiff(String repository, String language, String start, @Nullable String end, int depth) {
        var tmpDir = new File("/tmp/git");
        var repoFile = new File(repository);
        LanguagePlugin plugin;
        try {
            plugin = switch (language) {
                case "java" -> new JavaPlugin(tmpDir);
                case "js" -> new JsPlugin();
                case "c" -> new CPlugin();
                default -> throw new Error("Language " + language + " is not supported");
            };
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        var refDiff = new RefDiffCustom(plugin);

        var commits = new ArrayList<Commit>();
        int numErrors;
        if (end == null && depth == 1) {
            var commit = refDiff.computeDiffForCommit(repoFile, start);
            commits.add(commit);
            numErrors = 0; // above should throw error
        } else {
            numErrors = refDiff.computeDiffForCommitHistory(repoFile, start, end, depth, (commit) -> {
                commits.add(commit);
                System.out.printf("%d. %s [%d refactorings found]\n", commits.size(), commit.sha1(), commit.refactorings().size());

                // aggressive gc
                if (commits.size() % 100 == 0) System.gc();
            });
        }

        var numRefactorings = commits.stream().mapToInt((c) -> c.refactorings().size()).sum();
        System.out.printf("Completed scanning %d commits, found %d refactorings (encountered %d errors).\n", commits.size(), numRefactorings, numErrors);
        return commits;
    }

    private static void output(String out, boolean pretty, List<Commit> refactorings) {
        var mapper = new ObjectMapper();
        var outFile = new File(out);
        try {
            if (pretty) {
                mapper.writerWithDefaultPrettyPrinter()
                        .writeValue(outFile, refactorings);
            } else {
                mapper.writeValue(outFile, refactorings);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void run(String[] args) throws ArgumentParserException {
        var ns = parseArgs(args);
        var refactorings = runRefDiff(
                ns.getString("repository"),
                ns.getString("language"),
                ns.getString("start"),
                ns.getString("end"),
                ns.getInt("depth")
        );
        output(ns.getString("out"), ns.getBoolean("pretty"), refactorings);
    }
}
