import { appDatabaseName, storageKey } from '@avalon/storage'

/** This app's namespace: localStorage `avalon:deal:*`, IndexedDB `avalon-deal`. */
export const APP_ID = 'deal'
export const key = (name: string) => storageKey(APP_ID, name)
export const DB_NAME = appDatabaseName(APP_ID)
