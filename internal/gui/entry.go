package gui

import (
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/driver/desktop"
	"fyne.io/fyne/v2/widget"
)

// entry with multiline support
type entry struct {
	widget.Entry
	shiftHeld   bool
	rowsVisible int
}

func newEntry() *entry {
	i := &entry{}
	i.ExtendBaseWidget(i)
	i.rowsVisible = 2

	return i
}

func (i *entry) TypedKey(key *fyne.KeyEvent) {
	if key.Name == fyne.KeyReturn {
		if i.shiftHeld && !i.MultiLine {
			i.MultiLine = true
			i.SetMinRowsVisible(i.rowsVisible)
			i.rowsVisible++
		} else if i.shiftHeld {
			i.rowsVisible++
			i.SetMinRowsVisible(i.rowsVisible)
		} else if !i.shiftHeld && i.MultiLine {
			i.Resize(fyne.NewSize(i.Size().Width, i.Size().Height/2))
			i.MultiLine = false
		}

		// User is submitting the entry
		if !i.shiftHeld {
			sendMsg()
		}
	}

	i.Entry.TypedKey(key)
}

func (i *entry) KeyDown(key *fyne.KeyEvent) {
	if key.Name == desktop.KeyShiftLeft || key.Name == desktop.KeyShiftRight {
		i.shiftHeld = true
	}

	i.Entry.KeyDown(key)
}

func (i *entry) KeyUp(key *fyne.KeyEvent) {
	if key.Name == desktop.KeyShiftLeft || key.Name == desktop.KeyShiftRight {
		i.shiftHeld = false
	}

	i.Entry.KeyUp(key)
}
