import { appDatabaseName, storageKey } from '@avalon/storage'

/** This app's namespace: localStorage `avalon:assistant:*`, IndexedDB `avalon-assistant`. */
export const APP_ID = 'assistant'
export const key = (name: string) => storageKey(APP_ID, name)
export const DB_NAME = appDatabaseName(APP_ID)
