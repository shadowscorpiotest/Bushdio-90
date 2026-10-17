// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
// JPEG frames otherwise produce full-range yuvj420p, which many phone players reject
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
