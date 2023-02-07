import objects.Location;
import objects.Refactoring;
import org.eclipse.jgit.annotations.Nullable;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.revwalk.filter.RevFilter;
import refdiff.core.cst.CstNode;
import refdiff.core.diff.CstComparator;
import refdiff.core.diff.CstDiff;
import refdiff.core.io.FilePathFilter;
import refdiff.core.io.GitHelper;
import refdiff.core.io.SourceFile;
import refdiff.core.io.SourceFileSet;
import refdiff.core.util.PairBeforeAfter;
import refdiff.parsers.LanguagePlugin;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BiConsumer;

/**
 * Customized class of refdiff.core.RefDiff to catch RuntimeExceptions.
 * Includes modified copy of RefDiff source code.
 * RefDiff is licensed under MIT license.
 */
public class RefDiffCustom {
    private final CstComparator comparator;
    private final FilePathFilter fileFilter;

    /**
     * Build a RefDiff instance with the specified language plugin. E.g.: {@code new RefDiff(new JsParser())}.
     *
     * @param parser A language parser
     */
    public RefDiffCustom(LanguagePlugin parser) {
        this.comparator = new CstComparator(parser);
        this.fileFilter = parser.getAllowedFilesFilter();
    }

    private Location readLocation(SourceFileSet fileSet, CstNode node) {
        try {
            var loc = node.getLocation();
            var content = fileSet.readContent(new SourceFile(Path.of(loc.getFile())));
            return new Location(
                    loc.getFile(),
                    Location.charLocToLineCol(loc.getBegin(), content),
                    Location.charLocToLineCol(loc.getEnd(), content),
                    Location.charLocToLineCol(loc.getBodyBegin(), content),
                    Location.charLocToLineCol(loc.getBodyEnd(), content)
            );
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void forEachNonMergeCommit(Repository repo, String startAt, @Nullable String endAt, int maxDepth, BiConsumer<RevCommit, RevCommit> function) {
        try (RevWalk revWalk = new RevWalk(repo)) {
            RevCommit head = revWalk.parseCommit(repo.resolve(startAt));
            RevCommit end = endAt != null ? revWalk.parseCommit(repo.resolve(endAt)) : null;
            revWalk.markStart(head);
            revWalk.setRevFilter(RevFilter.NO_MERGES);

            int count = 0;
            for (RevCommit commit : revWalk) {
                if (commit.getParentCount() == 1) {
                    function.accept(commit.getParent(0), commit);
                }
                if (end != null && commit.name().equals(end.name())) {
                    break;
                }

                count++;

                if (count >= maxDepth)
                    break;
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Compute the CST diff for each commit in the git repository, starting from the specified commit. Merge comits are skipped.
     *
     * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
     * @param startAt       git object reference of the starting commit.
     * @param endAt         git object reference of the ending commit.
     * @param maxDepth      Number of commits that will be navigated backwards at maximum.
     * @param diffConsumer  Consumer function that will be called for each computed CST diff.
     * @return Number of errors encountered.
     */
    public int computeDiffForCommitHistory(File gitRepository, String startAt, @Nullable String endAt, int maxDepth, BiConsumer<RevCommit, List<Refactoring>> diffConsumer) {
        var numErrors = new AtomicInteger();
        try (Repository repo = GitHelper.openRepository(gitRepository)) {
            forEachNonMergeCommit(repo, startAt, endAt, maxDepth, (revBefore, revAfter) -> {
                PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, revBefore, revAfter, fileFilter);

                CstDiff diff;
                try {
                    diff = comparator.compare(beforeAndAfter);
                } catch (RuntimeException e) {
                    System.err.printf("Encountered error while computing refactorings for commit %s %s\n", revAfter.getName(), revAfter.getShortMessage());
                    e.printStackTrace();
                    numErrors.incrementAndGet();
                    return;
                }

                var refs = diff.getRefactoringRelationships()
                        .stream()
                        .map((rel) -> new Refactoring(
                                rel,
                                readLocation(beforeAndAfter.getBefore(), rel.getNodeBefore()),
                                readLocation(beforeAndAfter.getAfter(), rel.getNodeAfter())
                        ))
                        .toList();

                diffConsumer.accept(revAfter, refs);
            });
        }
        return numErrors.get();
    }
}
