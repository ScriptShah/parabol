import {DataLoaderWorker} from '../../graphql'
import getRethink from '../../../database/rethinkDriver'

const hideConversionModal = async (orgId: string, dataLoader: DataLoaderWorker) => {
  const organization = await dataLoader.get('organizations').load(orgId)
  const {showConversionModal} = organization
  if (showConversionModal) {
    const r = getRethink()
    await r.table('Organization').get(orgId).update({
      showConversionModal: false
    })
    organization.showConversionModal = false
    const teams = await dataLoader.get('teamsByOrgId').load(orgId)
    const teamIds = teams.map(({id}) => id)
    const activeMeetingsByTeamId = await dataLoader.get('activeMeetingsByTeamId').loadMany(teamIds)
    if (activeMeetingsByTeamId.length > 0) {
      const activeMeetings = activeMeetingsByTeamId.flat()
      activeMeetings.forEach((meeting) => {
        meeting.showConversionModal = false
      })
      const meetingIds = activeMeetings.map(({id}) => id)
      await r.table('NewMeeting')
        .getAll(r.args(meetingIds))
        .update({
          showConversionModal: false
        })
      return activeMeetings
    }
  }
  return []
}

export default hideConversionModal
