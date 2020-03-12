import styled from '@emotion/styled'
import graphql from 'babel-plugin-relay/macro'
import React from 'react'
import {createFragmentContainer} from 'react-relay'
import {PALETTE} from 'styles/paletteV2'
import relativeDate from 'utils/date/relativeDate'
import {ThreadedCommentHeader_comment} from '__generated__/ThreadedCommentHeader_comment.graphql'
import CommentAuthorOptionsButton from './CommentAuthorOptionsButton'
import AddReactjiButton from './ReflectionCard/AddReactjiButton'
import ThreadedReplyButton from './ThreadedReplyButton'
import ThreadedItemHeaderDescription from './ThreadedItemHeaderDescription'

const HeaderActions = styled('div')<{isViewerComment: boolean}>(({isViewerComment}) => ({
  color: PALETTE.TEXT_GRAY,
  display: 'flex',
  fontWeight: 600,
  paddingRight: !isViewerComment ? 32 : 8
}))

const AddReactji = styled(AddReactjiButton)({
  display: 'flex',
  padding: 0
})

interface Props {
  comment: ThreadedCommentHeader_comment
  editComment: () => void
  onToggleReactji: (emojiId: string) => void
  onReply: () => void
}

const ThreadedCommentHeader = (props: Props) => {
  const {comment, onReply, editComment, onToggleReactji} = props
  const {id: commentId, createdByUser, isActive, isViewerComment, reactjis, updatedAt} = comment
  const name = isActive ? createdByUser?.preferredName ?? 'Anonymous' : 'Messaged Deleted'
  const hasReactjis = reactjis.length > 0
  return (
    <ThreadedItemHeaderDescription title={name} subTitle={relativeDate(updatedAt)}>
      <HeaderActions isViewerComment={isViewerComment}>
        {!hasReactjis && (
          <>
            <AddReactji onToggle={onToggleReactji} />
            <ThreadedReplyButton onReply={onReply} />
          </>
        )}
        {isViewerComment && (
          <CommentAuthorOptionsButton editComment={editComment} commentId={commentId} />
        )}
      </HeaderActions>
    </ThreadedItemHeaderDescription>
  )
}

export default createFragmentContainer(ThreadedCommentHeader, {
  comment: graphql`
    fragment ThreadedCommentHeader_comment on Comment {
      id
      createdByUser {
        preferredName
      }
      isActive
      isViewerComment
      reactjis {
        id
      }
      updatedAt
    }
  `
})
