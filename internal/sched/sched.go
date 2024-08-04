package sched

import (
	"fmt"
	"time"

	"github.com/robfig/cron/v3"
)

var Now = func() time.Time {
	return time.Now()
}

type Cron struct {
	RunAt int64
	Cron  string
	Cmd   string // For future use
}

func NewCron(runAt int64, cron string) Cron {
	return Cron{runAt, cron, "move"}
}

func BeginningOfTheDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func Tomorrow() int64 {
	now := time.Now().AddDate(0, 0, 1)
	tomorrow := now.AddDate(0, 0, 1)

	return BeginningOfTheDay(tomorrow).Unix()
}

// Next returns next unix time for cron expression
func Next(crn string) int64 {
	sched, err := cron.ParseStandard(crn)
	// TODO release, we should not panic when a user provided bad config
	if err != nil {
		// It's a logical error in code, we don't obtain cron expressions from user input
		panic(fmt.Errorf("invalid cron expression %s: %w", crn, err))
	}

	return sched.Next(Now().UTC()).Unix()
}
