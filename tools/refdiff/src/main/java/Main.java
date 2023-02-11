import net.sourceforge.argparse4j.inf.ArgumentParserException;

import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws ArgumentParserException {
        if (args.length == 0) {
            System.out.println("Usage: refdiff <process|serve> [args]");
            System.exit(1);
        }

        var subArgs = Arrays.copyOfRange(args, 1, args.length);
        switch (args[0]) {
            case "process" -> CLI.run(subArgs);
            case "serve" -> Server.serve(subArgs);
            default -> {
                System.out.println("Usage: refdiff <process|serve> [args]");
                System.exit(1);
            }
        }
    }
}
