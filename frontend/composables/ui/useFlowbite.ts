import type { default as FlowbiteModule } from 'flowbite';

export function useFlowbite(callback: (callback: typeof FlowbiteModule) => void): void {
  if (import.meta.client) {
    import('flowbite').then(flowbite => {
      callback(flowbite);
    });
  }
}
