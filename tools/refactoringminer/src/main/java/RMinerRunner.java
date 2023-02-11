import org.eclipse.jgit.annotations.Nullable;
import org.refactoringminer.api.Refactoring;
import org.refactoringminer.api.RefactoringHandler;
import org.refactoringminer.rm1.GitHistoryRefactoringMinerImpl;
import org.refactoringminer.util.GitServiceImpl;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class RMinerRunner {
    private final String repo;
    private final String commit;
    private final Duration timeout;

    private final List<Refactoring> refactorings;
    private boolean finished;

    public RMinerRunner(String repo, String commit, Duration timeout) {
        this.repo = repo;
        this.commit = commit;
        this.timeout = timeout;

        this.refactorings = new ArrayList<>();
        this.finished = false;
    }

    private static class Handler extends RefactoringHandler {
        private final RMinerRunner runner;

        private Handler(RMinerRunner runner) {
            this.runner = runner;
        }

        @Override
        public void handle(String commitId, List<Refactoring> refactorings) {
            synchronized (runner) {
                runner.refactorings.addAll(refactorings);
                runner.finished = true; // onFinish is not called in detectAtCommit
            }
        }

        @Override
        public void onFinish(int refactoringsCount, int commitsCount, int errorCommitsCount) {
            synchronized (runner) {
                runner.finished = true;
            }
        }
    }

    @Nullable
    public List<Refactoring> run() throws Exception {
        var git = new GitServiceImpl();
        var rminer = new GitHistoryRefactoringMinerImpl();

        try (var repo = git.openRepository(this.repo)) {
            rminer.detectAtCommit(repo, this.commit, new Handler(this), (int) this.timeout.toSeconds());
        }

        synchronized (this) {
            if (!this.finished) {
                return null;
            }
            return this.refactorings;
        }
    }
}
