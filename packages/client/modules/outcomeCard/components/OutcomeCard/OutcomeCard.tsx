import styled from '@emotion/styled'
import {Editor} from '@tiptap/core'
import graphql from 'babel-plugin-relay/macro'
import {memo} from 'react'
import {useFragment} from 'react-relay'
import {OutcomeCard_task$key} from '~/__generated__/OutcomeCard_task.graphql'
import {AreaEnum, TaskStatusEnum} from '~/__generated__/UpdateTaskMutation.graphql'
import EditingStatus from '~/components/EditingStatus/EditingStatus'
import {PALETTE} from '~/styles/paletteV3'
import IntegratedTaskContent from '../../../../components/IntegratedTaskContent'
import {TipTapEditor} from '../../../../components/promptResponse/TipTapEditor'
import {LinkMenuState} from '../../../../components/promptResponse/TipTapLinkMenu'
import TaskIntegrationLink from '../../../../components/TaskIntegrationLink'
import TaskWatermark from '../../../../components/TaskWatermark'
import useAtmosphere from '../../../../hooks/useAtmosphere'
import useTaskChildFocus, {UseTaskChild} from '../../../../hooks/useTaskChildFocus'
import UpdateTaskMutation from '../../../../mutations/UpdateTaskMutation'
import {cardFocusShadow, cardHoverShadow, cardShadow, Elevation} from '../../../../styles/elevation'
import cardRootStyles from '../../../../styles/helpers/cardRootStyles'
import {Card} from '../../../../types/constEnums'
import isTaskArchived from '../../../../utils/isTaskArchived'
import isTaskPrivate from '../../../../utils/isTaskPrivate'
import {taskStatusLabels} from '../../../../utils/taskStatus'
import TaskFooter from '../OutcomeCardFooter/TaskFooter'
import OutcomeCardStatusIndicator from '../OutcomeCardStatusIndicator/OutcomeCardStatusIndicator'

const RootCard = styled('div')<{
  isTaskHovered: boolean
  isTaskFocused: boolean
  isDragging: boolean
  isTaskHighlighted: boolean
}>(({isTaskHovered, isTaskFocused, isDragging, isTaskHighlighted}) => ({
  ...cardRootStyles,
  borderTop: 0,
  outline: isTaskHighlighted ? `2px solid ${PALETTE.SKY_300}` : 'none',
  padding: `${Card.PADDING} 0 0`,
  transition: `box-shadow 100ms ease-in`,
  // hover before focus, it matters
  boxShadow: isDragging
    ? Elevation.CARD_DRAGGING
    : isTaskHighlighted
      ? cardHoverShadow
      : isTaskFocused
        ? cardFocusShadow
        : isTaskHovered
          ? cardHoverShadow
          : cardShadow
}))

const ContentBlock = styled('div')({
  position: 'relative'
})

const StatusIndicatorBlock = styled('div')({
  display: 'flex'
})

const TaskEditorWrapper = styled('div')()

interface Props {
  area: AreaEnum
  isTaskFocused: boolean
  isTaskHovered: boolean
  editor: Editor
  linkState: LinkMenuState
  setLinkState: (linkState: LinkMenuState) => void
  handleCardUpdate: () => void
  isAgenda: boolean
  isDraggingOver: TaskStatusEnum | undefined
  task: OutcomeCard_task$key
  useTaskChild: UseTaskChild
  dataCy: string
}

const OutcomeCard = memo((props: Props) => {
  const {
    area,
    isTaskFocused,
    isTaskHovered,
    editor,
    linkState,
    setLinkState,
    handleCardUpdate,
    isAgenda,
    isDraggingOver,
    task: taskRef,
    useTaskChild,
    dataCy
  } = props
  const task = useFragment(
    graphql`
      fragment OutcomeCard_task on Task @argumentDefinitions(meetingId: {type: "ID"}) {
        ...IntegratedTaskContent_task
        editors {
          userId
        }
        id
        integration {
          __typename
          ...TaskIntegrationLink_integration
        }
        status
        tags
        # grab userId to ensure sorting on connections works
        userId
        isHighlighted(meetingId: $meetingId)
        ...EditingStatus_task
        ...TaskFooter_task
      }
    `,
    taskRef
  )
  const isPrivate = isTaskPrivate(task.tags)
  const isArchived = isTaskArchived(task.tags)
  const toggleTag = (tagId: string) => {
    const {state, view} = editor
    const {doc, schema, tr} = state
    if (task.tags.includes(tagId)) {
      doc.descendants((node, pos) => {
        if (node.type.name === 'taskTag' && node.attrs.id === tagId) {
          tr.delete(pos, pos + node.nodeSize)
        }
      })
      view.dispatch(tr)
      const nextContent = JSON.stringify(editor.getJSON())
      UpdateTaskMutation(atmosphere, {updatedTask: {id: taskId, content: nextContent}}, {})
      return
    }
    // Create the mention node
    const mentionNode = schema.nodes.taskTag!.create({id: tagId})

    // Insert the mention node at the end
    const transaction = tr.insert(doc.content.size, mentionNode)
    view.dispatch(transaction)
    const nextContent = JSON.stringify(editor.getJSON())
    UpdateTaskMutation(atmosphere, {updatedTask: {id: taskId, content: nextContent}}, {})
  }
  const {integration, status, id: taskId, isHighlighted, editors} = task
  const atmosphere = useAtmosphere()
  const {viewerId} = atmosphere
  const otherEditors = editors.filter((editor) => editor.userId !== viewerId)
  const isEditing = editors.length > otherEditors.length
  const {addTaskChild, removeTaskChild} = useTaskChildFocus(taskId)
  const type = integration?.__typename
  const statusTitle = `Card status: ${taskStatusLabels[status]}`
  const privateTitle = ', marked as #private'
  const archivedTitle = ', set as #archived'
  const statusIndicatorTitle = `${statusTitle}${isPrivate ? privateTitle : ''}${
    isArchived ? archivedTitle : ''
  }`
  return (
    <RootCard
      isTaskHovered={isTaskHovered}
      isTaskFocused={isTaskFocused}
      isDragging={!!isDraggingOver}
      isTaskHighlighted={!!isHighlighted}
    >
      <TaskWatermark type={type} />
      <ContentBlock>
        <EditingStatus
          isTaskHovered={isTaskHovered}
          isArchived={isArchived}
          task={task}
          useTaskChild={useTaskChild}
        >
          <StatusIndicatorBlock data-cy={`${dataCy}-status`} title={statusIndicatorTitle}>
            <OutcomeCardStatusIndicator status={isDraggingOver || status} />
            {isPrivate && <OutcomeCardStatusIndicator status='private' />}
            {isArchived && <OutcomeCardStatusIndicator status='archived' />}
          </StatusIndicatorBlock>
        </EditingStatus>
        <IntegratedTaskContent task={task} />
        {!type && (
          <TaskEditorWrapper
            onBlur={() => {
              removeTaskChild('root')
              setTimeout(handleCardUpdate)
            }}
            onFocus={() => addTaskChild('root')}
          >
            <TipTapEditor
              editor={editor}
              linkState={linkState}
              setLinkState={setLinkState}
              useLinkEditor={() => useTaskChild('editor-link-changer')}
            />
          </TaskEditorWrapper>
        )}
        <TaskIntegrationLink dataCy={`${dataCy}`} integration={integration || null} />
        <TaskFooter
          dataCy={`${dataCy}`}
          area={area}
          cardIsActive={isTaskFocused || isTaskHovered || isEditing}
          toggleTag={toggleTag}
          isAgenda={isAgenda}
          task={task}
          useTaskChild={useTaskChild}
        />
      </ContentBlock>
    </RootCard>
  )
})

export default OutcomeCard
