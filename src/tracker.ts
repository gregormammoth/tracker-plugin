declare const HOSTNAME: string;
declare const SERVER_PORT: string;

type TrackerEvent = {
  event: string;
  tags: string[];
  url: string;
  title: string;
  ts: number;
};

interface Tracker {
  track(event: string, ...tags: string[]): void;
}

class TrackerService implements Tracker {
  private buffer: TrackerEvent[] = [];
  private timeoutId?: NodeJS.Timeout;
  private timestampInMilliseconds?: number;
  private lastRequestTimestamp: number = 0;
  private readonly trackerObjectName: string = "TrackerObject";
  private readonly wait: number = 1000;
  private nextPage?: string;

  constructor() {
    this.applySnippetQueue();
    this.addUnloadListener();
    this.addLinksListeners();
  }

  public track(event: string, ...tags: string[]) {
    this.addEventsToBuffer([
      {
        event,
        tags,
        url: window.location.href,
        title: window.document.title,
        ts: TrackerService.getUnixSeconds(this.timestampInMilliseconds),
      },
    ]);
  }

  private static getUnixSeconds (date: number = Date.now()) {
    return Math.floor(date / 1000);
  }

  private applySnippetQueue() {
    const objectName = window[this.trackerObjectName];
    const initialData = window[objectName] as { l?: number; q?: string[][] };
    this.timestampInMilliseconds = initialData?.l;
    initialData?.q?.forEach((args) => {
      const [event, ...tags] = [...args];
      this.track(event, ...tags);
    });
    this.timestampInMilliseconds = undefined;
  }

  private addUnloadListener() {
    window.onbeforeunload = () => {
      this.sendData();
    };
  }

  private addLinksListeners() {
    const links = document.getElementsByTagName("a");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener("click", (event) => {
        event.preventDefault();
        if (event.target instanceof HTMLAnchorElement) {
          this.nextPage = event.target.href;
        }
      });
    }
  }

  private addEventsToBuffer(bufferItems) {
    this.buffer.push(...bufferItems);
    queueMicrotask(() => {
      if (Date.now() - this.lastRequestTimestamp > this.wait || this.buffer.length >= 3) {
        if (this.timeoutId) {
          this.timeoutId = undefined;
          clearTimeout(this.timeoutId);
        }
        this.sendData();
      } else {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = undefined;
          this.sendData();
        }, this.wait);
      }
    });
  }

  private goToNextPageIfEmptyBuffer() {
    if (this.nextPage) {
      if (!this.buffer.length) {
        window.location.href = this.nextPage;
        this.nextPage = undefined;
      } else {
        this.sendData();
      }
    }
  }

  private sendData() {
    if (this.buffer.length) {
      const bufferItems = [...this.buffer];
      const body = JSON.stringify(bufferItems);
      this.buffer = [];
      this.lastRequestTimestamp = Date.now();
      fetch(`${HOSTNAME}:${SERVER_PORT}/track`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body,
      })
        .then(() => {
          this.goToNextPageIfEmptyBuffer();
        })
        .catch(() => {
          setTimeout(() => {
            this.addEventsToBuffer(bufferItems);
          }, this.wait);
        });
    }
  }
}

(window as Window & { tracker?: Tracker }).tracker = new TrackerService();
