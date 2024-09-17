package gui

import (
	"strings"

	"fyne.io/fyne/v2/driver/desktop"
	"fyne.io/fyne/v2/widget"

	"zakirullin/stuffbot/pkg/txt"
)

// button is a button with added pointer cursor
type button struct {
	widget.Button
}

func newButton(text string, onTapped func()) *button {
	if len(text) > maxCharsPerLine {
		text = txt.Substr(text, 0, maxCharsPerLine) + "..."
	}
	text = strings.Replace(text, " ", "\t", 1)
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
