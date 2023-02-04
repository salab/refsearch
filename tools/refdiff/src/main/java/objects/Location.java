package objects;

public record Location(
        String file,
        String begin,
        String end,
        String bodyBegin,
        String bodyEnd
) {
    public static String charLocToLineCol(int charLoc, CharSequence fileContent) {
        int line = 1;
        int lineStart = 0;
        for (int i = 0; i < charLoc; i++) {
            if (fileContent.charAt(i) == '\n') {
                line++;
                lineStart = i;
            }
        }
        int col = charLoc - lineStart;
        return String.format("%d:%d", line, col);
    }
}
