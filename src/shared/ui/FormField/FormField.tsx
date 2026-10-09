import { joinDescribedBy } from '@shared/lib';

import styles from './FormField.module.scss';

import type { FormFieldControlType, FormFieldProps } from './FormField.types';

/** Label, hint, and error wired to the control. */
export const FormField = ({ id, label, hint, error, describedBy, children }: FormFieldProps) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control: FormFieldControlType = {
    id,
    invalid: Boolean(error),
    errorId,
    describedBy: joinDescribedBy([hintId, errorId, describedBy]),
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children(control)}
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
};
