import { Alert as NativeAlert } from "react-native";

type AlertButtonStyle = "default" | "cancel" | "destructive";

export interface AppAlertButton {
  text?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

export interface AppAlertOptions {
  cancelable?: boolean;
  presentation?: "center" | "sheet";
}

export interface AppAlertPayload {
  title?: string;
  message?: string;
  type?: "success" | "error" | "warning" | "info";
  buttons?: AppAlertButton[];
  options?: AppAlertOptions;
}

type AppAlertHandler = (payload: AppAlertPayload) => void;

let handler: AppAlertHandler | null = null;
const nativeFallback = NativeAlert.alert.bind(NativeAlert);

export const appAlert = {
  setHandler(next: AppAlertHandler | null) {
    handler = next;
  },
  alert(
    title?: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions,
  ) {
    if (handler) {
      handler({ title, message, buttons, options });
      return;
    }

    nativeFallback(title ?? '', message, buttons as any, options as any);
  },
  show(payload: AppAlertPayload) {
    if (handler) {
      handler(payload);
      return;
    }

    nativeFallback(
      payload.title ?? '',
      payload.message,
      payload.buttons as any,
      payload.options as any,
    );
  },
  success(title: string, message?: string, options?: AppAlertOptions) {
    appAlert.show({ title, message, type: "success", options });
  },
  error(title: string, message?: string, options?: AppAlertOptions) {
    appAlert.show({ title, message, type: "error", options });
  },
  warning(title: string, message?: string, options?: AppAlertOptions) {
    appAlert.show({ title, message, type: "warning", options });
  },
  info(title: string, message?: string, options?: AppAlertOptions) {
    appAlert.show({ title, message, type: "info", options });
  },
};
