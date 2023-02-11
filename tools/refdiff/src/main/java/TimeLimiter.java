import java.time.Duration;

public class TimeLimiter {
    private final Runnable target;
    private final Duration timeout;
    private boolean finished;
    private Exception e;

    public TimeLimiter(Runnable target, Duration timeout) {
        this.target = target;
        this.timeout = timeout;
        this.finished = false;
    }

    private record Sleeper(long millis) implements Runnable {
        @Override
        public void run() {
            try {
                Thread.sleep(this.millis);
            } catch (InterruptedException ignored) {
            }
        }
    }

    public boolean run() {
        var limiter = this;

        var t2 = new Thread(new Sleeper(this.timeout.toMillis()));
        t2.start();

        var t1 = new Thread(() -> {
            try {
                target.run();
            } catch (Exception e) {
                synchronized (limiter) {
                    this.e = e;
                }
                t2.interrupt();
                return;
            }
            synchronized (limiter) {
                finished = true;
            }
            t2.interrupt();
        });
        t1.start();

        try {
            t2.join();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        synchronized (limiter) {
            if (this.e != null) {
                throw new RuntimeException(e);
            }
        }

        synchronized (limiter) {
            if (!finished) {
                t1.stop();
            }
        }

        return finished;
    }
}
