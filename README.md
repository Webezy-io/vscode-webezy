# Webezy.io

This is an extension for [webezy.io CLI](https://www.webezy.io) to create manage and deploy your projects with visual represntations and helpers.

## Requirements

This extension using and levreging the webezy.io cli.
You need to install the webezy.io cli from pip

```sh
pip install webezyio
```

## Documentation

For a deeper dive into how this extension can be used in your already exisiting webezy.io projects

- [CLI documentation](https://www.webezy.io/docs/cli)
- [vscode extension](https://www.webezy.io/docs/vscode)

### Usage

Once webezy extension is installed on your vscode editor [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=webezy.vscode-webezy)
you can open a folder that holds one or more webezy.io projects.
This folder can be a workspace folder for your all webezy.io projects.

__Quick usage__ - Open command pallate and run `"webezy.io: Help"` command. it will enter a setup walkthrough to get started quickly with vscode extension and CLI. 


1. Click on the webezy icon at the `Activity Bar` (The outer-left navigation bar), it will activate your webezy.io extension and will open up a fiew views and vscode integrated terminal for each of your projects inside the "Root folder".

2. Open up a folder which holding one or more webezy.io projects

![Init Extension Steps](assets/vscode-webezy-welcome.png)

## Features

Webezy.io vscode extension provide both a wrapper to the CLI and a custom addiotional views to your loved vscode editor.

This extension can be used to create and edit webezy.io projects or just as a co-pilot for easy navigation in your project resources.


Open webezy.io panel from `Activity Bar`:

> Note: At the first time your webezy.io extension has been activated you will need to choose a `Python` interpreter which webezy CLI is insatlled at.

![Open Webezy.io Extension](assets/webezyio-preview.gif)


> Tip: Some commands are available through the command pallate (windows `Ctrl+Shift+P` or MacOS `⌘+⇧+P`) try running `webezy: Display Version` to get your current installed webezy CLI in your environment. 

## Contributing

We are welcoming contributions by pull-request.

This extension is provided as open-source software from `webezy.io`, it can be enriched with additional functionalities.
Check our roadmap before trying to get your hands dirty.

- [Extension Commands](docs/extension-commands.md)
- [Extension Structure](docs/extension-structure.md)
- [Extension Development](docs/extension-development-cycle.md)


## Release Notes

Get all releases [notes](/docs/releases.md)

### Latest: 0.0.6

- Added `Generate` commands to command pallate
- Added `Run` command to run project server
- Added `Build` command to build project resources
- Added file watcher for webezy.json to auto refresh project view tree

---
_Created with love by Amit Shmulevitch. 2022 © webezy.io_

**Enjoy!** 
