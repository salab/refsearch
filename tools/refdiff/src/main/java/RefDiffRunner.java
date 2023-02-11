import objects.Refactoring;
import org.eclipse.jgit.annotations.Nullable;
import refdiff.parsers.LanguagePlugin;
import refdiff.parsers.c.CPlugin;
import refdiff.parsers.java.JavaPlugin;
import refdiff.parsers.js.JsPlugin;

import java.io.File;
import java.util.List;

public class RefDiffRunner implements Runnable {
    private final String dir;
    private final File tmpDir;
    private final String commit;
    private final String language;
    @Nullable
    private List<Refactoring> refactorings;

    public RefDiffRunner(String dir, File tmpDir, String commit, String language) {
        this.dir = dir;
        this.tmpDir = tmpDir;
        this.commit = commit;
        this.language = language;
    }

    private List<Refactoring> runRefDiff() throws Exception {
        var repoFile = new File(dir);

        LanguagePlugin plugin = switch (language) {
            case "java" -> new JavaPlugin(tmpDir);
            case "js" -> new JsPlugin();
            case "c" -> new CPlugin();
            default -> throw new Exception("Language " + language + " is not supported");
        };

        var refDiff = new RefDiffCustom(plugin);
        var res = refDiff.computeDiffForCommit(repoFile, commit);

        if (language.equals("js")) {
            ((JsPlugin) plugin).close();
        }

        return res.refactorings();
    }

    @Override
    public void run() {
        try {
            this.refactorings = runRefDiff();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Nullable
    public List<Refactoring> getRefactorings() {
        return refactorings;
    }
}
