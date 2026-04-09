import { type App, TFile, moment } from 'obsidian'
import { type TimerLog } from 'Logger'
import {
    getDailyNote,
    createDailyNote,
    getAllDailyNotes,
    getWeeklyNote,
    createWeeklyNote,
    getAllWeeklyNotes,
} from 'obsidian-daily-notes-interface'
import {
    TaskRegularExpressions,
    type TaskComponents,
} from 'serializer/TaskModels'
import { sotaLog } from './Debug';

export { 
    appHasDailyNotesPluginLoaded,
    appHasWeeklyNotesPluginLoaded,
} from 'obsidian-daily-notes-interface'

export function getTemplater(app: App) {
    return app.plugins.plugins['templater-obsidian']
}

export async function parseWithTemplater(
    app: App,
    tfile: TFile,
    templateContent: string,
    log: TimerLog,
) {
    const templater = getTemplater(app)

    if (!templater) return templateContent

    const preamble = `<%* const log = ${JSON.stringify(
        log,
    )}; log.begin = moment(log.begin); log.end = moment(log.end); %>`

    return await ( 
        templater.templater as {
            parse_template: ( 
                opt: { target_file: TFile, run_mode: number },
                content: string,
            ) => Promise<string>
        }
    ).parse_template(
        { target_file: tfile, run_mode: 4 },
        `${preamble}${templateContent}`,
    )
}

export const ensureFileExists = async ( 
    app: App,
    path: string,
    initialContent: string = ''
): Promise<TFile> => {
    const dirs = path.replace(/\\/g, '/').split('/')
    dirs.pop()

    if (dirs.length) {
        const dir = join(...dirs)
        if (!app.vault.getAbstractFileByPath(dir)) {
            await app.vault.createFolder(dir)
        }
    }

    const file = app.vault.getAbstractFileByPath(path)
    if (file) {
        if (file instanceof TFile) {
            const md = file as TFile
            if (md.extension == 'md') {
                return md
            } else {
                throw new Error(`invalid file extension: ${md.extension}`)
            }
        } else {
            throw new Error(`invalid file path: ${path}`)
        }
    } else {
        return await app.vault.create(path, initialContent)
    }
}

export const join = (...partSegments: string[]): string => {
    let parts: string[] = []
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split('/'))
    }
    const newParts = []
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i]
        if (!part || part === '.') continue
        else newParts.push(part)
    }
    if (parts[0] === '') newParts.unshift('')
    return newParts.join('/')
}

export const appendOrCreate = async ( 
    app: App,
    file: TFile | null,
    path: string,
    content: string
): Promise<TFile> => {
    if (file instanceof TFile) {
        await app.vault.append(file, `\n${content}`);
        return file;
    } else {
        sotaLog("Utils", `appendOrCreate: Arquivo '${path}' não existe. Criando com o primeiro log.`);
        return await ensureFileExists(app, path, content);
    }
}

export const getDailyNoteFile = async (): Promise<TFile> => {
    const file = getDailyNote(moment() as any, getAllDailyNotes())
    if (!file) {
        return await createDailyNote(moment() as any)
    }
    return file
}

export const getWeeklyNoteFile = async (): Promise<TFile> => {
    const file = getWeeklyNote(moment() as any, getAllWeeklyNotes())
    if (!file) {
        return await createWeeklyNote(moment() as any)
    }
    return file
}

export const appendFile = async ( 
    app: App,
    file: TFile,
    logText: string,
): Promise<void> => {
    await app.vault.append(file, logText)
}

const HASH_TAGS_REG_EXP = /(^|\s)#[^\s]+/g

export function extractHashtags(description: string): string[] {
    return description.match(HASH_TAGS_REG_EXP)?.map((tag) => tag.trim()) ?? []
}

export function extractTaskComponents(line: string): TaskComponents | null {
    const regexMatch = line.match(TaskRegularExpressions.taskRegex)
    if (regexMatch === null) {
        return null
    }

    const indentation = regexMatch[1]
    const listMarker = regexMatch[2]

    const statusString = regexMatch[3]
    const status = statusString

    let body = regexMatch[4].trim()

    const blockLinkMatch = body.match(TaskRegularExpressions.blockLinkRegex)
    const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : ''

    if (blockLink !== '') {
        body = body.replace(TaskRegularExpressions.blockLinkRegex, '').trim()
    }
    return { indentation, listMarker, status, body, blockLink }
}

export function toInlineFieldRegex(innerFieldRegex: RegExp): RegExp {
    const fieldRegex =
        '(?:\\(|\\[)' +         // Corrigido: `|` não deve estar dentro do grupo
        '\\s*' +
        innerFieldRegex.source +
        '\\s*' +
        '(?:\\)|\\])' +         // Corrigido: `|` não deve estar dentro do grupo e `\` escapado
        '(?:\\s*,)?' +
        '$';
    return new RegExp(fieldRegex, innerFieldRegex.flags);
}

export async function waitForTemplateProcessing(file: TFile): Promise<void> {
    sotaLog("Utils", `Iniciando espera pelo processamento do template para: ${file.path}`);
    const POLLING_INTERVAL = 250;
    const TIMEOUT = 5000;
    const GRACE_PERIOD = 500;

    let elapsedTime = 0;

    while (elapsedTime < TIMEOUT) {
        if (file.stat.size > 0) {
            sotaLog("Utils", `Conteúdo detectado em ${file.basename}. Aguardando período de cortesia.`);
            await new Promise(resolve => setTimeout(resolve, GRACE_PERIOD));
            sotaLog("Utils", `Espera finalizada para ${file.basename}.`);
            return;
        }
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        elapsedTime += POLLING_INTERVAL;
    }

    sotaLog("Utils", `TIMEOUT atingido para ${file.basename}. O arquivo ainda está vazio. Prosseguindo de qualquer maneira.`);
}


export function sanitize(text: string): string {
    if (!text) return "";
    return text
        .normalize("NFD") // Separa acentos
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_') // Espaços viram underline (OPA OPA -> opa_opa)
        .replace(/[^\w-]/g, ''); // Remove caracteres especiais restantes
}