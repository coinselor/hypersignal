export default defineAppConfig({
  ui: {
    colors: {
      primary: "lime",
      secondary: "blue",
      tertiary: "purple",
      neutral: "stone",
    },
    notifications: {
      // Show toasts at the top right of the screen
      position: "top-0 bottom-[unset]",
    },
    prose: {
      codePreview: {
        slots: {
          root: "my-5",
          preview: "flex justify-center border border-zinc-200 dark:border-zinc-800 relative p-4 rounded-md",
          code: "[&>div>pre]:rounded-t-none [&>div]:my-0",
        },
        variants: {
          code: {
            true: {
              preview: "border-b-0 rounded-b-none",
            },
          },
        },
      },
    },
  },
});
