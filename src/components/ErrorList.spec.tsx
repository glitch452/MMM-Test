import { expect } from 'chai';
import ErrorList from './ErrorList';
import React from 'jsx-dom-cjs';
import { serializeElement } from 'src/utils/serializeElement';
import 'chai-snapshot-matcher';

describe('LoadingErrors', function () {
  it('should render with no errors', function () {
    const actual = serializeElement(<ErrorList error_list={[]} />);
    expect(actual).to.matchSnapshot(this);
  });

  it('should render with no errors and a title', function () {
    const actual = serializeElement(<ErrorList title="test" error_list={[]} />);
    expect(actual).to.matchSnapshot(this);
  });

  it('should render with 1 error', function () {
    const actual = serializeElement(<ErrorList title="test" error_list={['error one']} />);
    expect(actual).to.matchSnapshot(this);
  });

  it('should render with more than 1 error', function () {
    const actual = serializeElement(<ErrorList error_list={['error one', 'error two']} />);
    expect(actual).to.matchSnapshot(this);
  });
});
