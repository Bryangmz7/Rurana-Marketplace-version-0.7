
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface FormField {
  value: any;
  error: string | null;
  touched: boolean;
}

interface FormState {
  [key: string]: FormField;
}

interface UseFormValidationProps {
  initialValues: Record<string, any>;
  validationRules: Record<string, ValidationRule>;
}

export const useFormValidation = ({ initialValues, validationRules }: UseFormValidationProps) => {
  const { toast } = useToast();

  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
      };
    });
    return state;
  });

  const validateField = useCallback((name: string, value: any): string | null => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'Este campo es requerido';
    }

    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Debe tener al menos ${rules.minLength} caracteres`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `No puede tener más de ${rules.maxLength} caracteres`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Formato inválido';
      }
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationRules]);

  const setValue = useCallback((name: string, value: any) => {
    setFormState(prev => {
      const error = validateField(name, value);
      return {
        ...prev,
        [name]: {
          value,
          error,
          touched: true,
        },
      };
    });
  }, [validateField]);

  const setError = useCallback((name: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);

  const validateAll = useCallback((): boolean => {
    let isValid = true;
    const newState = { ...formState };

    Object.keys(newState).forEach(name => {
      const error = validateField(name, newState[name].value);
      newState[name] = {
        ...newState[name],
        error,
        touched: true,
      };
      if (error) isValid = false;
    });

    setFormState(newState);
    return isValid;
  }, [formState, validateField]);

  const reset = useCallback(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
      };
    });
    setFormState(state);
  }, [initialValues]);

  const getValues = useCallback(() => {
    const values: Record<string, any> = {};
    Object.keys(formState).forEach(key => {
      values[key] = formState[key].value;
    });
    return values;
  }, [formState]);

  const hasErrors = Object.values(formState).some(field => field.error !== null);
  const isFormTouched = Object.values(formState).some(field => field.touched);

  return {
    formState,
    setValue,
    setError,
    validateAll,
    reset,
    getValues,
    hasErrors,
    isFormTouched,
  };
};
