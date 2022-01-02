import moment from 'moment';
import { ModuleConfig, module_config_schema } from './ModuleConfig';
import { replaceAll } from './utils';
import { MmmLogger } from './MmmLogger';
import React from 'jsx-dom';
import LoadingErrors from './LoadingErrors';

Module.register<ModuleConfig>('MMM-ViewNotifications', {
  /**
   * Initialize standard and module specific fields
   */
  init() {
    this.has_config_error = false;
    this.config_errors = [];
    this.logger = new MmmLogger(this);

    // Set module specific fields
    this.requiresVersion = '2.1.0';
    this.last_update = new Date();
    this.notifications = [];
  },

  /**
   * Override the setConfig function to use zod for parsing the configuration values
   * @param config (object) The user specified configuration options
   */
  setConfig(config: unknown): void {
    const result = module_config_schema.safeParse(config);
    this.has_config_error = !result.success;

    if (result.success) {
      this.config = result.data;
      this.logger.setLogLevel?.(this.config.logLevel);
    } else {
      for (const ze of result.error.errors) {
        const message = `'${ze.path}': ${ze.message}`;
        this.config_errors.push(message);
        this.logger.warn(`Configuration error '${ze.code}' in option ${message}`);
      }
    }
  },

  getScripts() {
    return ['moment.js'];
  },

  getStyles() {
    return ['MMM-ViewNotifications.css', 'font-awesome.css'];
  },

  start() {
    this.logger.debug(`start(): this.data: ${JSON.stringify(this.data)}`);
    this.logger.debug(`start(): this.config: ${JSON.stringify(this.config)}`);
  },

  notificationReceived(notification, payload, sender?: Module.ModuleProperties<unknown>) {
    if (this.has_config_error) {
      return;
    }
    // Check if the notification is coming from another module and not from MM itself
    if (sender) {
      this.logger.debug(
        `notificationReceived(): ${notification} ${JSON.stringify(payload)} sender.name`,
      );

      this.last_update = new Date();

      if (this.config.timeout > 0) {
        // Add a little time to make sure the current one has expired
        const timeout_offset_in_ms = 50;
        setTimeout(() => {
          this.cleanupNotificationsList();
          this.updateDom();
        }, this.config.timeout + timeout_offset_in_ms);
      }

      this.addNotification({
        datetime: new Date(),
        timeout: new Date(new Date().getTime() + this.config.timeout),
        notification,
        payload,
        sender,
      });
      this.updateDom();
    }
  },

  shouldAddNotification(n: Module.Notification): boolean {
    const is_excluded =
      this.config.excludeModules.includes(n.sender.name) ||
      this.config.excludeNotifications.includes(n.notification);
    if (is_excluded) {
      return false;
    }

    const is_name_not_included =
      this.config.includeModules.length && !this.config.includeModules.includes(n.sender.name);
    if (is_name_not_included) {
      return false;
    }

    const is_notification_not_included =
      this.config.includeNotifications.length &&
      !this.config.includeNotifications.includes(n.notification);
    if (is_notification_not_included) {
      return false;
    }

    return true;
  },

  addNotification(n: Module.Notification): void {
    if (!this.shouldAddNotification(n)) {
      return;
    }

    const is_maximum_size =
      this.config.maximum && this.notifications.length === this.config.maximum;

    if (this.config.newestOnTop) {
      this.notifications.unshift(n);
      if (is_maximum_size) {
        this.notifications.pop();
      }
    } else {
      this.notifications.push(n);
      if (is_maximum_size) {
        this.notifications.shift();
      }
    }
  },

  cleanupNotificationsList(): void {
    if (!this.notifications.length) {
      return;
    }
    const now = new Date();
    this.notifications = this.notifications.filter((n) => now < n.timeout);
  },

  formatNotification(n: Module.Notification): string {
    let output = this.config.format;
    output = replaceAll(output, '{notification}', n.notification);
    output = replaceAll(output, '{module}', n.sender.name);
    output = replaceAll(output, '{date}', moment(n.datetime.getTime()).format('YYYY-MM-DD'));
    output = replaceAll(output, '{time}', moment(n.datetime.getTime()).format('HH:mm:ss'));

    let match: RegExpMatchArray | null;
    while ((match = output.match(/\{date\|([^\}]+)\}/i))) {
      output = output.replace(match[0], moment(n.datetime.getTime()).format(match[1]));
    }

    if (n.payload === null || n.payload === undefined) {
      output = replaceAll(output, '{payloadList}', 'no payload');
      output = replaceAll(output, '{payloadData}', 'no payload');
    } else {
      if (Array.isArray(n.payload)) {
        output = replaceAll(output, '{payloadList}', `Array (${n.payload.length})`);
      } else {
        output = replaceAll(output, '{payloadList}', Object.keys(n.payload).toString());
      }
      output = replaceAll(output, '{payloadData}', JSON.stringify(n.payload));
    }

    return output;
  },

  getDom(): React.ReactNode {
    if (this.has_config_error) {
      return <LoadingErrors error_list={this.config_errors} />;
    }

    const now = new Date();
    return (
      <div className="small">
        <ul className="fa-ul">
          {this.notifications
            .filter((n) => this.config.timeout === 0 || now < n.timeout)
            .map((n) => {
              const icon_name = this.config.icons[n.sender.name]
                ? this.config.icons[n.sender.name]
                : this.config.defaultIcon;
              return (
                <li>
                  <span className={`fa-li fa fa-${icon_name}`} />
                  {this.formatNotification(n)}
                </li>
              );
            })}
        </ul>
      </div>
    );
  },
});
