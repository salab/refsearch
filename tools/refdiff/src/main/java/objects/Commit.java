package objects;

import java.util.List;

public record Commit(
        String sha1,
        List<Refactoring> refactorings
) {
}
