import React, { JSX } from 'jsx-dom-cjs';

export interface LoadingErrorsProps {
  title?: string;
  error_list: string[];
}

/**
 * Renders a list of messages and an optional title
 *
 * @param props The configuration options
 * @param props.title The title to render above the messages
 * @param props.error_list The list of messages to render
 * @returns A JSX Element
 */
const ErrorList = ({ title, error_list }: LoadingErrorsProps): JSX.Element => {
  return (
    <div className="loading small">
      {title}
      {title && error_list.length > 0 && <br />}
      {error_list.map((e, i) => (
        <>
          {e}
          {i !== error_list.length - 1 && <br />}
        </>
      ))}
    </div>
  );
};

export default ErrorList;
