/**
 * EventBridge validators.
 */

/**
 * Regular expression pattern for EventBridge event bus name validation.
 *
 * EventBridge event bus names must:
 * - Be "default" (the default event bus), OR
 * - Be 1-256 characters long
 * - Contain only alphanumeric characters, hyphens (-), underscores (_), periods (.), and forward slashes (/)
 *
 * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-event-bus.html
 */
const EVENT_BUS_NAME_PATTERN = /^(default|[\w./-]{1,256})$/;

/**
 * Validates an EventBridge event bus name against AWS naming rules.
 *
 * EventBridge event bus names must:
 * - Be "default" (the default event bus), OR
 * - Be 1-256 characters long
 * - Contain only alphanumeric characters (a-z, A-Z, 0-9), hyphens (-), underscores (_), periods (.), and forward slashes (/)
 *
 * @param value - The event bus name to validate
 * @returns true if the event bus name is valid, false otherwise
 *
 * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-event-bus.html
 *
 * @example
 * ```typescript
 * isValidEventBusName('default');              // true (default event bus)
 * isValidEventBusName('my-event-bus');         // true
 * isValidEventBusName('MyEventBus_123');       // true
 * isValidEventBusName('my.event.bus');         // true
 * isValidEventBusName('my/event/bus');         // true
 * isValidEventBusName('a');                    // true (minimum 1 character)
 * isValidEventBusName('');                     // false (empty)
 * isValidEventBusName('a'.repeat(257));        // false (too long)
 * isValidEventBusName('my event bus');         // false (contains space)
 * isValidEventBusName('my@event#bus');         // false (invalid characters)
 * ```
 */
export function isValidEventBusName(value: string): boolean {
  return EVENT_BUS_NAME_PATTERN.test(value);
}
