package objects;

import gr.uom.java.xmi.LocationInfo;
import gr.uom.java.xmi.diff.CodeRange;

public record CodeLocation(
        String filePath,
        int startLine,
        int endLine,
        int startColumn,
        int endColumn,
        LocationInfo.CodeElementType codeElementType,
        String description,
        String codeElement
) {
    public CodeLocation(CodeRange cr) {
        this(
                cr.getFilePath(),
                cr.getStartLine(),
                cr.getEndLine(),
                cr.getStartColumn(),
                cr.getEndColumn(),
                cr.getCodeElementType(),
                cr.getDescription(),
                cr.getCodeElement()
        );
    }
}
