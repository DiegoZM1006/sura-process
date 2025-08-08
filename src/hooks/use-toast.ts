import { toast } from 'sonner';

export const useToast = () => {
  const showError = (message: string) => {
    toast.error(message);
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
};
