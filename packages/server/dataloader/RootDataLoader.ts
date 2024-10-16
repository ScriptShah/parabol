import DataLoader from 'dataloader'
import RethinkPrimaryKeyLoaderMaker from './RethinkPrimaryKeyLoaderMaker'
import * as atlassianLoaders from './atlassianLoaders'
import * as azureDevOpsLoaders from './azureDevOpsLoaders'
import * as customLoaderMakers from './customLoaderMakers'
import * as foreignKeyLoaderMakers from './foreignKeyLoaderMakers'
import * as gcalLoaders from './gcalLoaders'
import * as githubLoaders from './githubLoaders'
import * as gitlabLoaders from './gitlabLoaders'
import * as integrationAuthLoaders from './integrationAuthLoaders'
import * as jiraServerLoaders from './jiraServerLoaders'
import * as pollLoaders from './pollsLoaders'
import * as primaryKeyLoaderMakers from './primaryKeyLoaderMakers'
import rethinkPrimaryKeyLoader from './rethinkPrimaryKeyLoader'
import * as rethinkPrimaryKeyLoaderMakers from './rethinkPrimaryKeyLoaderMakers'

interface LoaderDict {
  [loaderName: string]: DataLoader<any, any>
}

// Register all loaders
const loaderMakers = {
  ...rethinkPrimaryKeyLoaderMakers,
  ...primaryKeyLoaderMakers,
  ...foreignKeyLoaderMakers,
  ...customLoaderMakers,
  ...atlassianLoaders,
  ...jiraServerLoaders,
  ...customLoaderMakers,
  ...githubLoaders,
  ...gitlabLoaders,
  ...gcalLoaders,
  ...integrationAuthLoaders,
  ...pollLoaders,
  ...azureDevOpsLoaders
} as const

export type Loaders = keyof typeof loaderMakers

export type AllPrimaryLoaders =
  | keyof typeof primaryKeyLoaderMakers
  | keyof typeof rethinkPrimaryKeyLoaderMakers
export type RegisterDependsOn = (primaryLoaders: AllPrimaryLoaders | AllPrimaryLoaders[]) => void

// The RethinkDB logic is a leaky abstraction! It will be gone soon & this will be generic enough to put in its own package
interface GenericDataLoader<TLoaders, TPrimaryLoaderNames> {
  clearAll(pkLoaderName: TPrimaryLoaderNames | TPrimaryLoaderNames[]): void
  get<LoaderName extends keyof TLoaders, Loader extends TLoaders[LoaderName]>(
    loaderName: LoaderName
  ): Loader extends (...args: any[]) => any
    ? ReturnType<Loader>
    : // can delete below this line after RethinkDB is gone
      Loader extends RethinkPrimaryKeyLoaderMaker<infer U>
      ? ReturnType<typeof rethinkPrimaryKeyLoader<U>>
      : never
}

export type DataLoaderInstance = GenericDataLoader<typeof loaderMakers, AllPrimaryLoaders>

/**
 * This is the main dataloader
 */
export default class RootDataLoader<
  O extends DataLoader.Options<any, any> = DataLoader.Options<any, any>
> {
  dataLoaderOptions: O
  // casted to any because access to the loaders will results in a creation if needed
  loaders: LoaderDict = {} as any
  dependentLoaders: Record<string, string[]> = {}
  constructor(dataLoaderOptions: O = {} as O) {
    this.dataLoaderOptions = dataLoaderOptions
  }

  clearAll: DataLoaderInstance['clearAll'] = (inPkLoaderName) => {
    const pkLoaderNames = Array.isArray(inPkLoaderName) ? inPkLoaderName : [inPkLoaderName]
    const dependencies = pkLoaderNames.flatMap((pk) => [pk, ...(this.dependentLoaders[pk] ?? [])])
    dependencies.forEach((loaderName) => {
      this.loaders[loaderName]?.clearAll()
    })
  }
  get: DataLoaderInstance['get'] = (loaderName) => {
    let loader = this.loaders[loaderName]
    if (loader) return loader
    const loaderMaker = loaderMakers[loaderName as keyof typeof loaderMakers]
    const dependsOn: RegisterDependsOn = (inPrimaryLoaders) => {
      const primaryLoaders = Array.isArray(inPrimaryLoaders) ? inPrimaryLoaders : [inPrimaryLoaders]
      primaryLoaders.forEach((primaryLoader) => {
        ;(this.dependentLoaders[primaryLoader] ??= []).push(loaderName)
      })
    }
    if (loaderMaker instanceof RethinkPrimaryKeyLoaderMaker) {
      const {table} = loaderMaker
      loader = rethinkPrimaryKeyLoader(this.dataLoaderOptions, table)
    } else {
      loader = (loaderMaker as any)(this, dependsOn)
    }
    this.loaders[loaderName] = loader!
    return loader as any
  }
}
