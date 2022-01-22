/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-magic-numbers */

// Type definitions for non-npm package magicmirror-module 2.17.1
// Project: https://magicmirror.builders/
// These types were adapted from the following...
// Definitions by: Jalibu <https://github.com/jalibu>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare namespace Module {
  type RegisterProperties<T> = ThisType<NonNullable<Module.ModuleProperties<T>>> &
    Partial<Module.ModuleProperties<T>>;

  function register<T>(module_name: string, module_properties: RegisterProperties<T>): void;

  type NotificationIdentifier =
    | 'ALL_MODULES_STARTED'
    | 'DOM_OBJECTS_CREATED'
    | 'MODULE_DOM_CREATED'
    | string;

  interface Notification {
    datetime: Date;
    timeout: Date;
    notification: NotificationIdentifier;
    payload?: unknown;
    sender: Module.ModuleProperties<unknown>;
  }

  interface ModuleProperties<T> {
    // Add module specific fields and methods to the module definition
    notifications: Notification[];
    maybeAddNotification: (n: Notification) => boolean;
    notificationShouldBeAdded: (n: Module.Notification) => boolean;
    formatNotification: (n: Notification) => string;
    cleanupNotificationsList: () => void;
    scheduleNotificationCleanup: () => void;

    // Add standard non-built-in fields and methods to the module definition
    has_config_error: boolean;
    config_errors: string[];
    logger: Logger;

    // Define built-in fields and methods below

    readonly name: string;
    readonly identifier: string;
    readonly hidden: boolean;
    readonly data: ModuleData;
    readonly lockStrings: string[];
    config: T;
    defaults: Partial<T>;
    requiresVersion: string;

    setConfig: (config: unknown) => void;
    init: () => void;
    loaded: (callback?: () => void) => void;
    start: () => void;
    getScripts: () => string[];
    getStyles: () => string[];
    getTranslations: () => Record<string, string>;
    getTemplate: () => string;
    getTemplateData: () => unknown;
    getDom: () => HTMLElement | SVGElement;
    getHeader: () => string;
    notificationReceived: (
      notification: NotificationIdentifier,
      payload: unknown,
      sender?: ModuleProperties<unknown>,
    ) => void;
    socketNotificationReceived: (notification: string, payload: unknown) => void;
    suspend: () => void;
    resume: () => void;

    // Instance methods
    readonly file: (filename: string) => string;
    readonly updateDom: (speed?: number) => void;
    readonly sendNotification: (notification: NotificationIdentifier, payload: unknown) => void;
    readonly sendSocketNotification: (notification: string, payload: unknown) => void;
    readonly hide: (
      speed?: number,
      callback?: () => void,
      options?: { lockString: string },
    ) => void;
    readonly show: (
      speed?: number,
      callback?: () => void,
      options?: { lockString?: string; force?: boolean; onError?: () => void },
    ) => void;
    readonly translate: (identifier: string, variables?: unknown) => string;

    // Make entries in the module unknown unless defined here
    [key: string]: unknown;
  }

  const enum LoggerLevels {
    ERROR,
    WARN,
    INFO,
    DEBUG,
  }
  type LoggerLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

  interface Logger {
    level: LoggerLevels;
    properties: Module.ModuleProperties<unknown>;
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
    setLogLevel?: (level: Module.LoggerLevels | Module.LoggerLevel) => void;
  }

  export interface ModuleData {
    /**
     * The css classes which are added to the module dom wrapper.
     */
    classes: string;

    /**
     * The filename of the core module file.
     */
    file: string;

    /**
     * The path of the module folder.
     */
    path: string;

    /**
     * The header added to the module.
     */
    header: string;

    /**
     * The position in which the instance will be shown.
     */
    position: string;

    /**
     * The index position of the module in the modules list of the users config file.
     */
    index: string;

    /**
     * The unique identifier for the module instance.
     */
    identifier: string;

    /**
     * The user-provided configuration (pre-merge)
     */
    config: Record<string, unknown>;

    /**
     * The name of the module
     */
    name: string;

    /**
     * Whether the module should be hidden on startup
     */
    hiddenOnStartup: boolean | undefined;

    /**
     * Whether the config should be deep-merged with the defaults
     */
    configDeepMerge: boolean;
  }
}

declare module 'node_helper' {
  function create(
    object: ThisType<NonNullable<NodeHelperModule>> & Partial<NodeHelperModule>,
  ): void;

  interface NodeHelperModule {
    readonly name: string;
    readonly path: string;
    readonly expressApp: unknown;
    readonly io: unknown;
    readonly requiresVersion: string;

    // Overridable methods
    init: () => void;
    start: () => void;
    stop: () => void;
    socketNotificationReceived: (notification: string, payload: unknown) => void;
    sendSocketNotification: (notification: string, payload: unknown) => void;

    [key: string]: unknown;
  }
}

declare module 'logger' {
  function info(message?: unknown, ...optionalParams: unknown[]): void;
  function log(message?: unknown, ...optionalParams: unknown[]): void;
  function error(message?: unknown, ...optionalParams: unknown[]): void;
  function warn(message?: unknown, ...optionalParams: unknown[]): void;
  function group(groupTitle?: string, ...optionalParams: unknown[]): void;
  function groupCollapsed(groupTitle?: string, ...optionalParams: unknown[]): void;
  function groupEnd(): void;
  function time(timerName?: string): void;
  function timeEnd(timerName?: string): void;
  function timeStamp(timerName?: string): void;
}

declare const config: {
  address: string;
  customCss: string;
  electronOptions: unknown;
  ipWhitelist: string[];
  language: string;
  locale: string;
  modules: unknown[];
  port: number;
  timeFormat: 12 | 24;
  units: 'metric' | 'imperial';
  zoom: number;
};
