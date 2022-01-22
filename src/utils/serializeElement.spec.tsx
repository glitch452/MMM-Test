import { expect } from 'chai';
import React from 'jsx-dom-cjs';
import { serializeElement, serializeElementSandbox } from './serializeElement';
import 'chai-snapshot-matcher';

describe('serializeElement', () => {
  describe('serializeElement', () => {
    it('should serialize a basic element properly', function () {
      const actual = serializeElement(<div />);
      expect(actual).to.matchSnapshot(this);
    });

    it('should serialize an element with properties properly', function () {
      const actual = serializeElement(<div className="css-class" />);
      expect(actual).to.matchSnapshot(this);
    });

    it('should serialize a basic element properly when passed in as a function', function () {
      const actual = serializeElement(() => <div />);
      expect(actual).to.matchSnapshot(this);
    });
  });

  describe('serializeElementSandbox', () => {
    it('should serialize a basic element properly', function () {
      const actual = serializeElementSandbox(() => <div />);
      expect(actual).to.matchSnapshot(this);
    });

    it('should serialize an element with properties properly', function () {
      const actual = serializeElementSandbox(() => <div className="css-class" />);
      expect(actual).to.matchSnapshot(this);
    });
  });
});
