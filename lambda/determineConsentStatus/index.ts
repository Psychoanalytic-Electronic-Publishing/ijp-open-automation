interface TestEvent {
  hasConsent: boolean;
  isLive: boolean;
}

export async function main(event: TestEvent) {
  console.log("Event", event);

  return event;
}
