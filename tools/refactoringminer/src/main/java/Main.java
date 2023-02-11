import org.refactoringminer.RefactoringMiner;

import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.out.println("Usage: rminer <process|serve> [args]");
            System.exit(1);
        }

        var subArgs = Arrays.copyOfRange(args, 1, args.length);
        switch (args[0]) {
            case "process" -> RefactoringMiner.main(subArgs);
            case "serve" -> Server.serve(subArgs);
            default -> {
                System.out.println("Usage: rminer <process|serve> [args]");
                System.exit(1);
            }
        }
    }
}
