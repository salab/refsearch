package objects;

import gr.uom.java.xmi.diff.CodeRange;
import org.refactoringminer.api.Refactoring;

import java.util.List;
import java.util.stream.Collectors;

public record RefactoringJSON(
        String type,
        String description,
        List<CodeLocation> leftSideLocations,
        List<CodeLocation> rightSideLocations
) {
    private static List<CodeLocation> map(List<CodeRange> ranges) {
        return ranges
                .stream()
                .map(CodeLocation::new)
                .collect(Collectors.toList());
    }

    public RefactoringJSON(Refactoring r) {
        this(
                r.getName(),
                r.toString(),
                map(r.leftSide()),
                map(r.rightSide())
        );
    }
}
