global.Module = {
  register: () => undefined,
} as unknown as typeof Module;

import { JSDOM } from 'jsdom';
import { expect } from 'chai';
import sinon, { SinonFakeTimers, SinonSandbox, SinonSpy, SinonStub } from 'sinon';
import { MODULE, MMM_BASE } from './MMM-ViewNotifications';
import { ModuleConfig } from './ModuleConfig';

const NOTIFICATION = 'TEST_NOTIFICATION';
const PAYLOAD = { foo: 'bar' };
const DEFAULT_CONFIG = { logLevel: 'DEBUG' };
const MODULE_NAME = 'test-module';

const WINDOW = global.window;
const DOCUMENT = global.document;
const NAVIGATOR = global.navigator;

const sandbox: SinonSandbox = sinon.createSandbox();

describe('MMM-ViewNotifications', () => {
  let test_module: Module.ModuleProperties<ModuleConfig>;
  let stubUpdateDom: SinonSpy<[speed?: number | undefined], void>;

  beforeEach(() => {
    const updateDom = (_time: number) => undefined;
    const translate = (key: string) => key;
    test_module = {
      updateDom,
      translate,
      hidden: false,
      name: MODULE_NAME,
      ...MODULE,
    } as Module.ModuleProperties<ModuleConfig>;
    test_module.init();
    test_module.setConfig(DEFAULT_CONFIG);
    stubUpdateDom = sandbox.spy(test_module, 'updateDom');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('init', () => {
    beforeEach(() => {
      test_module = MODULE as Module.ModuleProperties<ModuleConfig>;
    });

    it('should set the default values', () => {
      test_module.init();
      expect(test_module).to.haveOwnProperty('notifications').that.is.an('array').which.is.empty;
    });

    it('should call the base module init method', () => {
      const stub = sandbox.stub(MMM_BASE, 'init').returns(undefined);
      test_module.init();
      expect(stub.callCount).to.equal(1);
    });
  });

  describe('getScripts', () => {
    it('should return an array of strings', () => {
      const actual = test_module.getScripts();
      expect(actual).to.be.an('array').that.is.not.empty;
      expect(actual.every((x) => typeof x === 'string')).to.be.true;
    });
  });

  describe('getStyles', () => {
    it('should return an array of strings', () => {
      const actual = test_module.getStyles();
      expect(actual).to.be.an('array').that.is.not.empty;
      expect(actual.every((x) => typeof x === 'string')).to.be.true;
    });
  });

  describe('getTranslations', () => {
    it('should return an object of strings', () => {
      const actual = Object.keys(test_module.getTranslations());
      expect(actual).to.be.an('array').that.is.not.empty;
      expect(actual.every((x) => typeof x === 'string')).to.be.true;
    });
  });

  describe('notificationReceived', () => {
    const notification = 'TEST_NOTIFICATION';
    const payload = { foo: 'bar' };

    beforeEach(() => {
      test_module.has_config_error = false;
      sandbox.stub(test_module.logger, 'debug').returns(undefined);
    });

    it('should do nothing if there is a config error for the module', () => {
      test_module.has_config_error = true;
      const stub = sandbox.stub(test_module, 'maybeAddNotification').returns(false);
      test_module.notificationReceived(notification, payload, test_module);

      expect(stub.callCount).to.equal(0);
    });

    it('should do nothing if the module is hidden', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (test_module as any).hidden = true;
      const stub = sandbox.stub(test_module, 'maybeAddNotification').returns(false);
      test_module.notificationReceived(notification, payload, test_module);

      expect(stub.callCount).to.equal(0);
    });

    it('should do nothing if there is no sender', () => {
      const stub = sandbox.stub(test_module, 'maybeAddNotification').returns(false);
      test_module.notificationReceived(notification, payload);

      expect(stub.callCount).to.equal(0);
    });

    it('should add a notification with the correct data', () => {
      const datetime = new Date('2022-01-09T13:00:00');
      sandbox.useFakeTimers(datetime);
      const stubAddNotification = sandbox.stub(test_module, 'maybeAddNotification').returns(false);
      test_module.notificationReceived(notification, payload, test_module);

      expect(stubAddNotification.callCount).to.equal(1);

      const actual = stubAddNotification.firstCall.args[0];
      const expected = {
        datetime,
        timeout: new Date(datetime.getTime() + test_module.config.timeout),
        notification,
        payload,
        sender: test_module,
      };

      expect(actual).to.deep.equal(expected);
    });

    it('should schedule a cleanup and update the dom if a new notification was added', () => {
      const stubAddNotification = sandbox.stub(test_module, 'maybeAddNotification').returns(true);
      const stub = sandbox.stub(test_module, 'scheduleNotificationCleanup').returns(undefined);
      test_module.notificationReceived(notification, payload, test_module);

      expect(stubAddNotification.callCount).to.equal(1);
      expect(stub.callCount).to.equal(1);
      expect(stubUpdateDom.callCount).to.equal(1);
    });

    it('should NOT schedule a cleanup and update the dom if a new notification was NOT added', () => {
      const stubAddNotification = sandbox.stub(test_module, 'maybeAddNotification').returns(false);
      const stub = sandbox.stub(test_module, 'scheduleNotificationCleanup').returns(undefined);
      test_module.notificationReceived(notification, payload, test_module);

      expect(stubAddNotification.callCount).to.equal(1);
      expect(stub.callCount).to.equal(0);
      expect(stubUpdateDom.callCount).to.equal(0);
    });
  });

  describe('resume', () => {
    it('should cleanup the notification list', () => {
      sandbox.stub(test_module.logger, 'info').returns(undefined);
      const stub = sandbox.stub(test_module, 'cleanupNotificationsList').returns(undefined);
      test_module.resume();
      expect(stub.callCount).to.equal(1);
    });
  });

  describe('scheduleNotificationCleanup', () => {
    const timeout_offset_in_ms = 50;
    let clock: SinonFakeTimers;

    beforeEach(() => {
      clock = sandbox.useFakeTimers();
    });

    it('should cleanup notifications when the timer expires if the timeout is greater than 0', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, timeout: 8 });
      const stub = sandbox.stub(test_module, 'cleanupNotificationsList').returns(undefined);
      test_module.scheduleNotificationCleanup();
      clock.tick(test_module.config.timeout + timeout_offset_in_ms);

      expect(stub.callCount).to.equal(1);
      expect(stubUpdateDom.callCount).to.equal(1);
    });

    it('should do nothing when the config timeout is 0', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, timeout: 0 });
      const stub = sandbox.stub(test_module, 'cleanupNotificationsList').returns(undefined);
      test_module.scheduleNotificationCleanup();
      clock.tick(test_module.config.timeout + timeout_offset_in_ms);

      expect(stub.callCount).to.equal(0);
      expect(stubUpdateDom.callCount).to.equal(0);
    });

    it('should do nothing if the timer expires when the module is hidden', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, timeout: 8 });
      const stub = sandbox.stub(test_module, 'cleanupNotificationsList').returns(undefined);
      test_module.scheduleNotificationCleanup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (test_module as any).hidden = true;
      clock.tick(test_module.config.timeout + timeout_offset_in_ms);

      expect(stub.callCount).to.equal(0);
      expect(stubUpdateDom.callCount).to.equal(0);
    });
  });

  describe('shouldAddNotification', () => {
    let NOTIFICATION_OBJ: Module.Notification;

    beforeEach(() => {
      const datetime = new Date();
      NOTIFICATION_OBJ = {
        datetime,
        timeout: new Date(datetime.getTime() + test_module.config.timeout),
        notification: NOTIFICATION,
        payload: PAYLOAD,
        sender: test_module,
      };
    });

    it('should return true if there are no filters', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.true;
    });

    it('should return false if the sender module is excluded', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, excludeModules: [test_module.name] });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.false;
    });

    it('should return false if the notification is excluded', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, excludeNotifications: [NOTIFICATION] });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.false;
    });

    it('should return false if the sender module is not included in a non-empty list', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, includeModules: ['only-me'] });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.false;
    });

    it('should return false if the notification is not included in a non-empty list', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, includeNotifications: ['only-me'] });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.false;
    });

    it('should return true if the sender module is included', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, includeModules: [MODULE_NAME] });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.true;
    });

    it('should return true if the notification is included', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, includeNotifications: [NOTIFICATION] });
      const is_actual = test_module.notificationShouldBeAdded(NOTIFICATION_OBJ);

      expect(is_actual).to.be.true;
    });
  });

  describe('maybeAddNotification', () => {
    let NOTIFICATION_OBJ: Module.Notification;
    let stubShouldBeAdded: SinonStub<[n: Module.Notification], boolean>;

    beforeEach(() => {
      const datetime = new Date();
      NOTIFICATION_OBJ = {
        datetime,
        timeout: new Date(datetime.getTime() + test_module.config.timeout),
        notification: NOTIFICATION,
        payload: PAYLOAD,
        sender: test_module,
      };
      stubShouldBeAdded = sandbox.stub(test_module, 'notificationShouldBeAdded').returns(true);
    });

    it('should return true if the notification should be added', () => {
      stubShouldBeAdded.returns(true);
      const is_actual = test_module.maybeAddNotification(NOTIFICATION_OBJ);

      expect(stubShouldBeAdded.callCount).to.equal(1);
      expect(is_actual).to.be.true;
    });

    it('should return false if the notification should NOT be added', () => {
      stubShouldBeAdded.returns(false);
      const is_actual = test_module.maybeAddNotification(NOTIFICATION_OBJ);

      expect(stubShouldBeAdded.callCount).to.equal(1);
      expect(is_actual).to.be.false;
    });

    it('should add all the notifications when the maximum is 0', () => {
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);

      expect(test_module.notifications).to.be.an('array').with.length(4);
    });

    it('should remove oldest notifications if the maximum is reached', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, maximum: 2 });
      const oldest = { ...NOTIFICATION_OBJ, notification: 'oldest' };
      test_module.maybeAddNotification(oldest);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);

      expect(test_module.notifications).to.be.an('array').with.length(2);
      expect(test_module.notifications).to.not.contain(oldest);
    });

    it('should add the newest notifications to the end of the list', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, maximum: 2, newestOnTop: false });
      const newest = { ...NOTIFICATION_OBJ, notification: 'newest' };
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(NOTIFICATION_OBJ);
      test_module.maybeAddNotification(newest);

      expect(test_module.notifications).to.be.an('array').with.length(2);
      expect(test_module.notifications[1]).to.equal(newest);
    });
  });

  describe('cleanupNotificationsList', () => {
    let NOTIFICATION_OBJ: Module.Notification;

    beforeEach(() => {
      const datetime = new Date('2021-01-08T13:00:00');
      NOTIFICATION_OBJ = {
        datetime,
        timeout: new Date(datetime.getTime() + test_module.config.timeout),
        notification: NOTIFICATION,
        payload: PAYLOAD,
        sender: test_module,
      };
    });

    it('should remove notifications older than the cutoff', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, timeout: 5 });
      const datetime1 = new Date('2021-01-08T13:00:01');
      const datetime2 = new Date('2021-01-08T13:00:02');
      const datetime3 = new Date('2021-01-08T13:00:03');
      const datetime4 = new Date('2021-01-08T13:00:04');
      test_module.notifications = [
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime1,
          timeout: new Date(datetime1.getTime() + test_module.config.timeout),
        },
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime2,
          timeout: new Date(datetime2.getTime() + test_module.config.timeout),
        },
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime3,
          timeout: new Date(datetime3.getTime() + test_module.config.timeout),
        },
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime4,
          timeout: new Date(datetime4.getTime() + test_module.config.timeout),
        },
      ];
      const now = new Date('2021-01-08T13:00:07');
      sandbox.useFakeTimers(now);
      test_module.cleanupNotificationsList();
      const actual = test_module.notifications;

      expect(actual).to.be.an('array').with.length(2);
      expect(actual.every((x) => x.timeout >= now)).to.be.true;
    });

    it('should do nothing if all the notifications are newer than the cutoff', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, timeout: 8 });
      const datetime1 = new Date('2021-01-08T13:00:01');
      const datetime2 = new Date('2021-01-08T13:00:02');
      const datetime3 = new Date('2021-01-08T13:00:03');
      const datetime4 = new Date('2021-01-08T13:00:04');
      test_module.notifications = [
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime1,
          timeout: new Date(datetime1.getTime() + test_module.config.timeout),
        },
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime2,
          timeout: new Date(datetime2.getTime() + test_module.config.timeout),
        },
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime3,
          timeout: new Date(datetime3.getTime() + test_module.config.timeout),
        },
        {
          ...NOTIFICATION_OBJ,
          datetime: datetime4,
          timeout: new Date(datetime4.getTime() + test_module.config.timeout),
        },
      ];
      const now = new Date('2021-01-08T13:00:05');
      sandbox.useFakeTimers(now);
      test_module.cleanupNotificationsList();
      const actual = test_module.notifications;

      expect(actual).to.be.an('array').with.length(4);
      expect(actual.every((x) => x.timeout >= now)).to.be.true;
    });
  });

  describe('formatNotification', () => {
    let NOTIFICATION_OBJ: Module.Notification;

    beforeEach(() => {
      const datetime = new Date('2021-01-08T13:00:00');
      NOTIFICATION_OBJ = {
        datetime,
        timeout: new Date(datetime.getTime() + test_module.config.timeout),
        notification: NOTIFICATION,
        payload: PAYLOAD,
        sender: test_module,
      };
    });

    it('should replace the {notification} tags with the notification', () => {
      const format = 'This is a {notification} for {notification}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${NOTIFICATION} for ${NOTIFICATION}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });

    it('should replace the {module} tags with the sender name', () => {
      const format = 'This is a {module} for {module}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${NOTIFICATION_OBJ.sender.name} for ${NOTIFICATION_OBJ.sender.name}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });

    it('should replace the {date} tags with the date', () => {
      const date = '2021-01-08';
      const format = 'This is a {date} for {date}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${date} for ${date}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });

    it('should replace the {time} tags with the time', () => {
      const time = '13:00:00';
      const format = 'This is a {time} for {time}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${time} for ${time}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });

    it('should replace the {date|<format>} tags with the formatted date', () => {
      const formatted_date = 'Jan 8, 2021';
      const format = 'This is a {date|MMM D, YYYY} for {date|MMM D, YYYY}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${formatted_date} for ${formatted_date}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadList} and {payloadData} with `no payload` when there is no payload', () => {
      const payload_val = 'NO_PAYLOAD';
      const format = 'This is a {payloadList} - {payloadList} for {payloadData} - {payloadData}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} - ${payload_val} for ${payload_val} - ${payload_val}`;
      const actual = test_module.formatNotification({ ...NOTIFICATION_OBJ, payload: undefined });
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadData} using JSON.stringify to format it as a string', () => {
      const payload_val = JSON.stringify(PAYLOAD);
      const format = 'This is a {payloadData} for {payloadData}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} for ${payload_val}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadList} with the type and size when the payload is an array', () => {
      const temp_payload = [1, 2, 3, 4, 5];
      const payload_val = `Array (${temp_payload.length})`;
      const format = 'This is a {payloadList} for {payloadList}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} for ${payload_val}`;
      const actual = test_module.formatNotification({ ...NOTIFICATION_OBJ, payload: temp_payload });
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadList} with the type when the payload is a string', () => {
      const temp_payload = '';
      const payload_val = `string`;
      const format = 'This is a {payloadList} for {payloadList}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} for ${payload_val}`;
      const actual = test_module.formatNotification({ ...NOTIFICATION_OBJ, payload: temp_payload });
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadList} with the type when the payload is a boolean', () => {
      const is_temp_payload = true;
      const payload_val = `boolean`;
      const format = 'This is a {payloadList} for {payloadList}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} for ${payload_val}`;
      const actual = test_module.formatNotification({
        ...NOTIFICATION_OBJ,
        payload: is_temp_payload,
      });
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadList} with the type when the payload is a number', () => {
      const temp_payload = 0;
      const payload_val = `number`;
      const format = 'This is a {payloadList} for {payloadList}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} for ${payload_val}`;
      const actual = test_module.formatNotification({ ...NOTIFICATION_OBJ, payload: temp_payload });
      expect(actual).to.equal(expected);
    });

    it('should replace the {payloadList} using with a list of object keys when the payload is not an array', () => {
      const payload_val = Object.keys(PAYLOAD).toString();
      const format = 'This is a {payloadList} for {payloadList}';
      test_module.setConfig({ ...DEFAULT_CONFIG, format });
      const expected = `This is a ${payload_val} for ${payload_val}`;
      const actual = test_module.formatNotification(NOTIFICATION_OBJ);
      expect(actual).to.equal(expected);
    });
  });

  describe('getDom', () => {
    let NOTIFICATION_OBJ: Module.Notification;
    let dom: JSDOM;

    beforeEach(() => {
      dom = new JSDOM('<!doctype html><html><body></body></html>');
      global.window = dom.window as unknown as Window & typeof globalThis;
      global.document = dom.window.document;
      global.navigator = dom.window.navigator;

      const datetime = new Date('2021-01-08T13:00:00');
      NOTIFICATION_OBJ = {
        datetime,
        timeout: new Date(datetime.getTime() + test_module.config.timeout),
        notification: NOTIFICATION,
        payload: PAYLOAD,
        sender: test_module,
      };
    });

    afterEach(() => {
      global.window = WINDOW;
      global.document = DOCUMENT;
      global.navigator = NAVIGATOR;
    });

    it('should render no notifications', () => {
      const dom_objects = test_module.getDom();
      const actual = dom_objects.outerHTML;
      const expected = '<div class="small"><ul class="fa-ul"></ul></div>';

      expect(actual).to.equal(expected);
    });

    it('should render one notification', () => {
      test_module.notifications = [NOTIFICATION_OBJ];
      const dom_objects = test_module.getDom();
      const actual = dom_objects.outerHTML;
      const expected =
        '<div class="small"><ul class="fa-ul"><li><span class="fa-li fa fa-bullhorn"></span>13:00:00: "test-module" sent "TEST_NOTIFICATION"</li></ul></div>';

      expect(actual).to.equal(expected);
    });

    it('should render oldest notifications first when newestOnTop is false', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, format: '{notification}', newestOnTop: false });
      const notification_1 = { ...NOTIFICATION_OBJ, notification: '1' };
      const notification_2 = { ...NOTIFICATION_OBJ, notification: '2' };
      test_module.notifications = [notification_1, notification_2];
      const dom_objects = test_module.getDom();
      const actual = dom_objects.outerHTML;
      const expected =
        '<div class="small"><ul class="fa-ul"><li><span class="fa-li fa fa-bullhorn"></span>1</li><li><span class="fa-li fa fa-bullhorn"></span>2</li></ul></div>';

      expect(actual).to.equal(expected);
      expect(test_module.notifications[0]).to.equal(notification_1);
      expect(test_module.notifications[1]).to.equal(notification_2);
    });

    it('should render oldest notifications last when newestOnTop is true', () => {
      test_module.setConfig({ ...DEFAULT_CONFIG, format: '{notification}', newestOnTop: true });
      const notification_1 = { ...NOTIFICATION_OBJ, notification: '1' };
      const notification_2 = { ...NOTIFICATION_OBJ, notification: '2' };
      test_module.notifications = [notification_1, notification_2];
      const dom_objects = test_module.getDom();
      const actual = dom_objects.outerHTML;
      const expected =
        '<div class="small"><ul class="fa-ul"><li><span class="fa-li fa fa-bullhorn"></span>2</li><li><span class="fa-li fa fa-bullhorn"></span>1</li></ul></div>';

      expect(actual).to.equal(expected);
      expect(test_module.notifications[0]).to.equal(notification_1);
      expect(test_module.notifications[1]).to.equal(notification_2);
    });

    it('should render the correct icon', () => {
      test_module.notifications = [NOTIFICATION_OBJ];
      test_module.setConfig({ ...DEFAULT_CONFIG, icons: { [test_module.name]: 'test-icon' } });
      const dom_objects = test_module.getDom();
      const actual = dom_objects.outerHTML;
      const expected =
        '<div class="small"><ul class="fa-ul"><li><span class="fa-li fa fa-test-icon"></span>13:00:00: "test-module" sent "TEST_NOTIFICATION"</li></ul></div>';

      expect(actual).to.equal(expected);
    });

    it('should render the configuration error list when there is a config error', () => {
      sandbox.stub(test_module.logger, 'error').returns(undefined);
      test_module.setConfig({ ...DEFAULT_CONFIG, timeout: -1 });
      const dom_objects = test_module.getDom();
      const actual = dom_objects.outerHTML;
      const expected = `<div class="loading small">CONFIGURATION_ERROR<br>'timeout': Value should be greater than or equal to 0</div>`;

      expect(actual).to.equal(expected);
    });
  });
});
