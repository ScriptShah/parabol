import {SelectQueryBuilder, Selectable} from 'kysely'
import {
  Discussion as DiscussionPG,
  Insight as InsightPG,
  OrganizationUser as OrganizationUserPG,
  TaskEstimate as TaskEstimatePG,
  TeamMember as TeamMemberPG
} from '../pg.d'
import {
  selectAgendaItems,
  selectComments,
  selectMeetingSettings,
  selectNewFeatures,
  selectNewMeetings,
  selectOrganizations,
  selectReflectPrompts,
  selectRetroReflections,
  selectSlackAuths,
  selectSlackNotifications,
  selectSuggestedAction,
  selectTasks,
  selectTeamInvitations,
  selectTeamPromptResponses,
  selectTeams,
  selectTemplateScale,
  selectTemplateScaleRef
} from '../select'

type ExtractTypeFromQueryBuilderSelect<T extends (...args: any[]) => any> =
  ReturnType<T> extends SelectQueryBuilder<_, _, infer X> ? X : never

export type Discussion = Selectable<DiscussionPG>
export type ReactjiDB = {id: string; userId: string}

export type UsedReactjis = Record<string, number>
export type TranscriptBlock = {
  speaker: string
  words: string
}

export type AutogroupReflectionGroupType = {
  groupTitle: string
  reflectionIds: string[]
}

export type TaskTag = 'private' | 'archived'

export interface Organization
  extends ExtractTypeFromQueryBuilderSelect<typeof selectOrganizations> {}
export type OrganizationUser = Selectable<OrganizationUserPG>

export type Reactable = RetroReflection | TeamPromptResponse | Comment
export interface RetroReflection
  extends ExtractTypeFromQueryBuilderSelect<typeof selectRetroReflections> {}

export type SuggestedAction = ExtractTypeFromQueryBuilderSelect<typeof selectSuggestedAction>

export interface Team extends ExtractTypeFromQueryBuilderSelect<typeof selectTeams> {}

export type TeamMember = Selectable<TeamMemberPG>

export type TeamPromptResponse = ExtractTypeFromQueryBuilderSelect<typeof selectTeamPromptResponses>
export type TemplateScale = ExtractTypeFromQueryBuilderSelect<typeof selectTemplateScale>

// TODO refactor getTemplateScaleRefsByIds to kysely
export type TemplateScaleRef = ExtractTypeFromQueryBuilderSelect<typeof selectTemplateScaleRef>

export type MeetingSettings = ExtractTypeFromQueryBuilderSelect<typeof selectMeetingSettings>
export type PokerMeetingSettings = MeetingSettings & {meetingType: 'poker'}
export type RetrospectiveMeetingSettings = MeetingSettings & {meetingType: 'retrospective'}

export type AgendaItem = ExtractTypeFromQueryBuilderSelect<typeof selectAgendaItems>

export type SlackAuth = ExtractTypeFromQueryBuilderSelect<typeof selectSlackAuths>

export type SlackNotification = ExtractTypeFromQueryBuilderSelect<typeof selectSlackNotifications>

export type Comment = ExtractTypeFromQueryBuilderSelect<typeof selectComments>
export type ReflectPrompt = ExtractTypeFromQueryBuilderSelect<typeof selectReflectPrompts>
export type Insight = Selectable<InsightPG>

export type NewMeeting = ExtractTypeFromQueryBuilderSelect<typeof selectNewMeetings>
export type NewFeature = ExtractTypeFromQueryBuilderSelect<typeof selectNewFeatures>
export type TeamInvitation = ExtractTypeFromQueryBuilderSelect<typeof selectTeamInvitations>
export type Task = ExtractTypeFromQueryBuilderSelect<typeof selectTasks>
export type TaskEstimate = Selectable<TaskEstimatePG>
