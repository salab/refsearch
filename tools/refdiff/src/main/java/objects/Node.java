package objects;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import refdiff.core.cst.CstNode;

@JsonSerialize
public record Node(
        String type,
        String name,
        Location location
) {
    public Node(CstNode node, Location location) {
        this(
                node.getType().replace("Declaration", ""),
                node.getLocalName(),
                location
        );
    }
}
