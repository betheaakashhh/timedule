import * as React from 'react'
import {
  Html, Head, Body, Container, Heading, Text,
  Button, Section, Hr, Preview,
} from '@react-email/components'

interface StreakMilestoneProps {
  name: string
  streakCount: number
  appUrl: string
}

const MILESTONE_MESSAGES: Record<number, string> = {
  3:   "3 days in! The habit is forming. Keep going! 🌱",
  7:   "One full week! You're building real momentum. 💪",
  14:  "Two weeks strong! This is becoming second nature. 🔥",
  30:  "One month! You've proven it to yourself. Outstanding. ⭐",
  60:  "Two months of consistency. You're exceptional. 🏆",
  100: "100 DAYS. Legendary. This is who you are now. 👑",
}

export function StreakMilestoneEmail({
  name = 'there',
  streakCount = 7,
  appUrl = 'https://timeflow.app',
}: StreakMilestoneProps) {
  const message = MILESTONE_MESSAGES[streakCount] ?? `${streakCount} days! Incredible consistency. Keep going!`

  return (
    <Html>
      <Head />
      <Preview>🎉 {streakCount}-day streak milestone reached!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={sunIcon}>☀️</Text>
            <Text style={logo}>TimeFlow</Text>
          </Section>

          <Section style={content}>
            <Text style={milestone}>{streakCount} days</Text>
            <Heading style={h1}>Milestone reached, {name}!</Heading>
            <Text style={text}>{message}</Text>

            <Section style={badgeBox}>
              <Text style={badgeText}>🏆 {streakCount}-Day Streak Badge Earned</Text>
            </Section>

            <Button href={appUrl + '/streak'} style={button}>
              View your achievements →
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

export default StreakMilestoneEmail

const body = { backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { maxWidth: '520px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' }
const header = { backgroundColor: '#534AB7', padding: '32px', textAlign: 'center' as const }
const sunIcon = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const logo = { color: '#ffffff', fontSize: '18px', fontWeight: '600', margin: '0' }
const content = { padding: '32px', textAlign: 'center' as const }
const milestone = { fontSize: '64px', fontWeight: '800', color: '#EF9F27', margin: '0 0 8px', lineHeight: '1' }
const h1 = { color: '#111827', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }
const text = { color: '#374151', fontSize: '16px', lineHeight: '1.6', margin: '0 0 12px' }
const badgeBox = { backgroundColor: '#EEF2FF', borderRadius: '12px', padding: '16px', margin: '20px 0' }
const badgeText = { color: '#4338CA', fontSize: '16px', fontWeight: '700', margin: '0' }
const button = {
  backgroundColor: '#534AB7', color: '#ffffff', padding: '14px 28px',
  borderRadius: '10px', fontWeight: '600', fontSize: '15px',
  textDecoration: 'none', display: 'inline-block', margin: '20px 0',
}
const hr = { borderColor: '#E5E7EB', margin: '24px 0 16px' }
const footer = { color: '#9CA3AF', fontSize: '12px', textAlign: 'center' as const }
const link = { color: '#7F77DD' }
