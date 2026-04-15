import * as React from 'react'
import {
  Html, Head, Body, Container, Heading, Text,
  Button, Section, Hr, Preview,
} from '@react-email/components'

interface StreakWarningProps {
  name: string
  streakCount: number
  incompleteCount: number
  appUrl: string
}

export function StreakWarningEmail({
  name = 'there',
  streakCount = 5,
  incompleteCount = 2,
  appUrl = 'https://timeflow.app',
}: StreakWarningProps) {
  return (
    <Html>
      <Head />
      <Preview>⚠️ Your {streakCount}-day streak is at risk — {incompleteCount} task{incompleteCount !== 1 ? 's' : ''} incomplete</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>☀️ TimeFlow</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Streak at risk, {name}!</Heading>
            <Text style={text}>
              You have a <strong>{streakCount}-day streak</strong> going — but{' '}
              <strong>{incompleteCount} strict task{incompleteCount !== 1 ? 's are' : ' is'} still incomplete</strong> today.
            </Text>
            <Text style={text}>
              Complete them before midnight to keep your streak alive. 🔥
            </Text>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ {incompleteCount} strict task{incompleteCount !== 1 ? 's' : ''} remaining
              </Text>
            </Section>

            <Button href={appUrl + '/dashboard'} style={button}>
              Open TimeFlow →
            </Button>

            <Text style={smallText}>
              You'll lose your streak if these aren't completed before midnight in your timezone.
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            TimeFlow · You're receiving this because email reminders are enabled.{' '}
            <a href={appUrl + '/settings'} style={link}>Manage preferences</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default StreakWarningEmail

const body = { backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { maxWidth: '520px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' }
const header = { backgroundColor: '#7F77DD', padding: '24px 32px' }
const logo = { color: '#ffffff', fontSize: '18px', fontWeight: '600', margin: '0' }
const content = { padding: '32px' }
const h1 = { color: '#111827', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }
const text = { color: '#374151', fontSize: '16px', lineHeight: '1.6', margin: '0 0 12px' }
const warningBox = { backgroundColor: '#FEF3C7', borderRadius: '12px', padding: '16px', margin: '20px 0' }
const warningText = { color: '#92400E', fontSize: '15px', fontWeight: '600', margin: '0' }
const button = {
  backgroundColor: '#7F77DD', color: '#ffffff', padding: '14px 28px',
  borderRadius: '10px', fontWeight: '600', fontSize: '15px',
  textDecoration: 'none', display: 'inline-block', margin: '20px 0',
}
const smallText = { color: '#6B7280', fontSize: '13px', margin: '12px 0 0' }
const hr = { borderColor: '#E5E7EB', margin: '24px 0 16px' }
const footer = { color: '#9CA3AF', fontSize: '12px', textAlign: 'center' as const }
const link = { color: '#7F77DD', textDecoration: 'underline' }
