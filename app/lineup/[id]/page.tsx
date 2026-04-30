import LineupClient from './LineupClient'

export function generateStaticParams() {
  return [{ id: 'local' }]
}

export default function LineupPage() {
  return <LineupClient />
}
