import type { ReactNode } from 'react';

/** Props passed into the field control. */
export type FormFieldControlType = {
  /** Control id. */
  id: string;
  /** True when a validation message is shown. */
  invalid: boolean;
  /** Error element id. Set only while the error is shown. */
  errorId: string | undefined;
  /** Ids for `aria-describedby`. */
  describedBy: string | undefined;
};

/** Label, hint, and error around one control. */
export type FormFieldProps = {
  /** Visible label. */
  label: string;
  /** Control id. */
  id: string;
  /** Hint under the control. */
  hint?: string;
  /** Validation message. */
  error?: string;
  /** Extra id for `aria-describedby`. */
  describedBy?: string;
  /** Control. Receives the id and aria props. */
  children: (control: FormFieldControlType) => ReactNode;
};
