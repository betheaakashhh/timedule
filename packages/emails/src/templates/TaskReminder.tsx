import * as React from 'react'
import {
  Html, Head, Body, Container, Heading, Text,
  Button, Section, Hr, Preview,
} from '@react-email/components'

interface TaskReminderProps {
  name: string
  taskLabel: string
  startTime: string
  tagName: string
  isStrict: boolean
  appUrl: string
}

export function TaskReminderEmail({
  name = 'there',
  taskLabel = 'Self study',
  startTime = '7:00 PM',
  tagName = 'Self study',
  isStrict = true,
  appUrl = 'https://timeflow.app',
}: TaskReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>⏰ {taskLabel} starts at {startTime}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>☀️ TimeFlow</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Time for {taskLabel}</Heading>
            <Text style={text}>
              Hey {name}, your <strong>{tagName}</strong> interval starts at <strong>{startTime}</strong>.
            </Text>

            {isStrict && (
              <Section style={strictBox}>
                <Text style={strictText}>🔒 This is a strict task — completion counts towards your streak</Text>
              </Section>
            )}

            <Button href={appUrl + '/dashboard'} style={button}>
              Open dashboard →
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            TimeFlow · <a href={appUrl + '/settings'} style={link}>Manage preferences</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default TaskReminderEmail

const body = { backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { maxWidth: '520px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' }
const header = { backgroundColor: '#7F77DD', padding: '24px 32px' }
const logo = { color: '#ffffff', fontSize: '18px', fontWeight: '600', margin: '0' }
const content = { padding: '32px' }
const h1 = { color: '#111827', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }
const text = { color: '#374151', fontSize: '16px', lineHeight: '1.6', margin: '0 0 12px' }
const strictBox = { backgroundColor: '#FEF3C7', borderRadius: '12px', padding: '14px', margin: '16px 0' }
const strictText = { color: '#92400E', fontSize: '14px', fontWeight: '600', margin: '0' }
const button = {
  backgroundColor: '#7F77DD', color: '#ffffff', padding: '14px 28px',
  borderRadius: '10px', fontWeight: '600', fontSize: '15px',
  textDecoration: 'none', display: 'inline-block', margin: '16px 0',
}
const hr = { borderColor: '#E5E7EB', margin: '24px 0 16px' }
const footer = { color: '#9CA3AF', fontSize: '12px', textAlign: 'center' as const }
const link = { color: '#7F77DD' }
