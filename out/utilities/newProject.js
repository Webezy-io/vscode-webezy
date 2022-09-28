"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newProject = void 0;
const vscode_1 = require("vscode");
/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
function newProject(context, webezy) {
    return __awaiter(this, void 0, void 0, function* () {
        class MyButton {
            constructor(iconPath, tooltip) {
                this.iconPath = iconPath;
                this.tooltip = tooltip;
            }
        }
        const createResourceGroupButton = new MyButton(new vscode_1.ThemeIcon('add'), 'Create Resource Group');
        const supportedLanguages = ['Python', 'Typescript']
            .map(label => ({ label }));
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                yield MultiStepInput.run(input => inputProjectName(input, state));
                return state;
            });
        }
        const title = 'Create Webezy Project';
        function inputProjectName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.name = yield input.showInputBox({
                    title,
                    step: 1,
                    totalSteps: 6,
                    value: typeof state.name === 'string' ? state.name : '',
                    prompt: 'Choose a unique name for the project',
                    validate: validateNameIsUnique,
                    shouldResume: shouldResume
                });
                return (input) => inputProjectLanguage(input, state);
            });
        }
        function inputProjectLanguage(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const pick = yield input.showQuickPick({
                    title,
                    step: 2,
                    totalSteps: 6,
                    placeholder: 'Choose project language (server side)',
                    items: supportedLanguages,
                    activeItem: typeof state.serverLanguage !== 'string' ? state.serverLanguage : undefined,
                    shouldResume: shouldResume
                });
                state.serverLanguage = pick;
                return (input) => inputProjectClients(input, state);
            });
        }
        function inputProjectClients(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const pick = yield input.showQuickPick({
                    title,
                    step: 3,
                    totalSteps: 6,
                    placeholder: 'Choose project clients',
                    items: supportedLanguages,
                    canSelectMany: true,
                    activeItem: typeof state.clients !== 'object' ? state.clients : undefined,
                    shouldResume: shouldResume,
                    validate: validateClientsSelection
                });
                state.clients = pick;
                return (input) => inputDomainName(input, state);
            });
        }
        function inputDomainName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                // TODO: Remember current value when navigating back.
                state.domain = yield input.showInputBox({
                    title,
                    step: 4,
                    totalSteps: 6,
                    value: state.domain || 'domain',
                    prompt: 'Enter your organization domain',
                    validate: validateDomain,
                    shouldResume: shouldResume
                });
                return (input) => inputHostName(input, state);
            });
        }
        function inputHostName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                // TODO: Remember current value when navigating back.
                state.host = yield input.showInputBox({
                    title,
                    step: 5,
                    totalSteps: 6,
                    value: state.host || 'localhost',
                    prompt: 'Enter the host name',
                    validate: validateHostName,
                    shouldResume: shouldResume
                });
                return (input) => inputPort(input, state);
            });
        }
        function inputPort(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                // TODO: Remember current value when navigating back.
                state.port = yield input.showInputBox({
                    title,
                    step: 6,
                    totalSteps: 6,
                    value: state.port || '50051',
                    prompt: 'Enter the port number',
                    validate: validatePortNumber,
                    shouldResume: shouldResume
                });
            });
        }
        // async function pickRuntime(input: MultiStepInput, state: Partial<State>) {
        // 	const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        // 	const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
        // 	// TODO: Remember currently active item when navigating back.
        // 	state.runtime = await input.showQuickPick({
        // 		title,
        // 		step: 6 + additionalSteps,
        // 		totalSteps: 6 + additionalSteps,
        // 		placeholder: 'Pick a runtime',
        // 		items: runtimes,
        // 		activeItem: state.runtime,
        // 		shouldResume: shouldResume
        // 	});
        // }
        function shouldResume() {
            // Could show a notification with the option to resume.
            return new Promise((resolve, reject) => {
                // noop
            });
        }
        function validateClientsSelection(clients) {
            return clients.length > 0 ? undefined : 'Must choose atleast 1 client';
        }
        function validateNameIsUnique(name) {
            return __awaiter(this, void 0, void 0, function* () {
                return webezy.projects[name] !== undefined ? 'Project name not unique' : undefined;
            });
        }
        function validateDomain(name) {
            return __awaiter(this, void 0, void 0, function* () {
                return name.includes('.') ? 'Domain must not include any suffix' : undefined;
            });
        }
        function validateHostName(host) {
            return __awaiter(this, void 0, void 0, function* () {
                return host !== 'localhost' ? undefined : host.includes('.') ? undefined : 'Host name must be a valid DNS or IP address.';
            });
        }
        function validatePortNumber(port) {
            return __awaiter(this, void 0, void 0, function* () {
                if (port.trim() === '') {
                    return 'Value must be a valid integer.';
                }
                return Number.isNaN(Number(port)) ? 'Value must be a valid integer.' : undefined;
            });
        }
        function getAvailableRuntimes(resourceGroup, token) {
            return __awaiter(this, void 0, void 0, function* () {
                // ...retrieve...
                // await new Promise(resolve => setTimeout(resolve, 1000));
                return ['Node 8.9', 'Node 6.11', 'Node 4.5']
                    .map(label => ({ label }));
            });
        }
        const state = yield collectInputs();
        vscode_1.window.showInformationMessage(`Creating Application Service '${state.name}'`);
        return state;
    });
}
exports.newProject = newProject;
// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------
class InputFlowAction {
}
InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static run(start) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = new MultiStepInput();
            return input.stepThrough(start);
        });
    }
    stepThrough(start) {
        return __awaiter(this, void 0, void 0, function* () {
            let step = start;
            while (step) {
                this.steps.push(step);
                if (this.current) {
                    this.current.enabled = false;
                    this.current.busy = true;
                }
                try {
                    step = yield step(this);
                }
                catch (err) {
                    if (err === InputFlowAction.back) {
                        this.steps.pop();
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.resume) {
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.cancel) {
                        step = undefined;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (this.current) {
                this.current.dispose();
            }
        });
    }
    showQuickPick({ title, step, totalSteps, items, activeItem, placeholder, buttons, canSelectMany, shouldResume, validate }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createQuickPick();
                    let itemsSelected = [];
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.placeholder = placeholder;
                    input.items = items;
                    input.canSelectMany = canSelectMany ? canSelectMany : false;
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            if (!input.canSelectMany) {
                                resolve(item);
                            }
                        }
                    }), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (input.canSelectMany) {
                        disposables.push(input.onDidChangeSelection(items => itemsSelected = items));
                        disposables.push(input.onDidAccept(() => {
                            if (validate) {
                                let validation = validate(itemsSelected);
                                if (validation === undefined) {
                                    resolve(itemsSelected);
                                }
                                else {
                                    vscode_1.window.showErrorMessage(validation);
                                }
                            }
                            else {
                                resolve(itemsSelected);
                            }
                        }));
                    }
                    else {
                        disposables.push(input.onDidChangeSelection(items => resolve(items[0])));
                    }
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
    showInputBox({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createInputBox();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.value = value || '';
                    input.prompt = prompt;
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    let validating = validate('');
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(yield validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    })), input.onDidChangeValue((text) => __awaiter(this, void 0, void 0, function* () {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = yield current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    })), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
}
//# sourceMappingURL=newProject.js.map