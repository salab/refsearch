package objects;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import refdiff.core.diff.Relationship;

@JsonSerialize
public record Refactoring(
        String type,
        Node before,
        Node after
) {
    public Refactoring(Relationship rel, Location locBefore, Location locAfter) {
        this(
                rel.getType().name(),
                new Node(rel.getNodeBefore(), locBefore),
                new Node(rel.getNodeAfter(), locAfter)
        );
    }
}
