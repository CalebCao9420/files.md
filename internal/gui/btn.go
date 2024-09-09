package gui

import (
	"fyne.io/fyne/v2/driver/desktop"
	"fyne.io/fyne/v2/widget"
)

// button is a button with added pointer cursor
type button struct {
	widget.Button
}

func newButton(text string, onTapped func()) *button {
	btn := &button{}
	btn.ExtendBaseWidget(btn)
	btn.Text = text
	btn.OnTapped = onTapped
	return btn
}

func (b *button) Cursor() desktop.Cursor {
	if !b.Disabled() {
		return desktop.PointerCursor
	}
	return desktop.DefaultCursor
}
