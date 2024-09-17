package gui

import (
	"io"
	"strings"
	"sync"
	"time"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/canvas"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/layout"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"

	"zakirullin/stuffbot/internal"
	"zakirullin/stuffbot/pkg/tg"
	"zakirullin/stuffbot/pkg/txt"
)

type ChatGUI struct {
	userID    int64
	messages  *fyne.Container
	scroll    *container.Scroll
	window    fyne.Window
	entry     *entry
	updater   func(updInterface internal.Update) error
	container *fyne.Container
	removable []*fyne.Container
	toastLock sync.Mutex
	menu      *widget.PopUpMenu
}

var Chat *ChatGUI

const (
	width           = 560
	height          = 580
	maxCharsPerLine = 50
)

func NewGui(userID int64, updater func(u internal.Update) error) *ChatGUI {
	return &ChatGUI{userID: userID, messages: container.NewVBox(), entry: newEntry(), updater: updater}
}

func (c *ChatGUI) Run(startupCMD tg.Cmd) {
	a := app.New()
	c.window = a.NewWindow("Files.md")

	handleCmd := func(cmd string) func() {
		return func() {
			c.updater(tg.NewFakeUpdCmd(1, tg.NewCmd(cmd, nil)))
		}
	}

	items := []*fyne.MenuItem{
		fyne.NewMenuItem("🏠\tToday", handleCmd("today")),
		fyne.NewMenuItem("📄\tFiles", handleCmd("files")),
		fyne.NewMenuItem("☑️\tChecklists", handleCmd("checklists")),
		fyne.NewMenuItem("📆\tSchedule", handleCmd("schedule")),
		fyne.NewMenuItem("📊\tStats", handleCmd("stats")),
		fyne.NewMenuItem("🦥\tPostpone", handleCmd("postpone")),
		fyne.NewMenuItem("✏️\tRename", handleCmd("rename")),
		fyne.NewMenuItem("➡️\tMove", handleCmd("move")),
		fyne.NewMenuItem("⚙️\tSettings", handleCmd("settings")),
		fyne.NewMenuItem("📕\tHelp", handleCmd("help")),
	}
	c.menu = widget.NewPopUpMenu(fyne.NewMenu("", items...), Chat.window.Canvas())

	menuBtn := newButton("📋", toggleMenu)
	sendBtn := newButton("✉️", sendMsg)

	inputLine := container.New(layout.NewBorderLayout(nil, nil, menuBtn, sendBtn), menuBtn, c.entry, sendBtn)
	c.scroll = container.NewVScroll(container.NewVBox(layout.NewSpacer(), c.messages))
	c.container = container.New(layout.NewBorderLayout(nil, inputLine, nil, nil), c.scroll, inputLine)

	c.window.SetContent(c.container)
	c.window.Resize(fyne.NewSize(width, height))
	c.window.Show()
	c.window.Canvas().Focus(c.entry)

	c.updater(tg.NewFakeUpdCmd(1, startupCMD))
	a.Run()
}

func (c *ChatGUI) Send(_ int64, text string, kb *tg.Keyboard, markup string) (int, error) {
	text = txt.StripHTMLTags(text)
	if len(text) == 0 {
		return 0, nil
	}

	// We don't need a separate container here I beleive
	btnsContainer := container.NewVBox()
	var msgContainer *fyne.Container
	if len(text) > maxCharsPerLine {
		text = txt.SplitLongLines(text, maxCharsPerLine)
		multilineEntry := widget.NewMultiLineEntry()
		multilineEntry.Text = text
		multilineEntry.ScrolledCallback = func(ev *fyne.ScrollEvent) {
			c.scroll.Scrolled(ev)
		}
		multilineEntry.SetMinRowsVisible(strings.Count(text, "\n") + 1)
		msgContainer = container.New(layout.NewBorderLayout(multilineEntry, btnsContainer, nil, nil))
		msgContainer.Add(multilineEntry)
		msgContainer.Add(btnsContainer)
	} else {
		label := widget.NewLabel(text)
		msgContainer = container.New(layout.NewBorderLayout(label, btnsContainer, nil, nil))
		msgContainer.Add(label)
		msgContainer.Add(btnsContainer)
	}
	c.attachKeyboard(kb, btnsContainer)

	title := text
	if len(title) > 50 {
		title = txt.Substr(text, 0, 50) + "..."
	}
	c.window.SetTitle(title)

	c.messages.Add(msgContainer)
	c.removable = append(c.removable, msgContainer)
	c.scroll.Refresh()
	c.scroll.ScrollToBottom()

	return 0, nil
}

func (c *ChatGUI) Edit(userID int64, _ int, text string, kb *tg.Keyboard, markup string) error {
	if len(text) == 0 {
		return nil
	}

	removeBotMessages()
	c.Send(userID, text, kb, markup)

	return nil
}

func (c *ChatGUI) Del(_ int64, _ int) error {
	return nil
}

func (c *ChatGUI) AnswerCallbackQuery(_ string, msg string) error {
	if len(msg) == 0 {
		return nil
	}

	if !c.toastLock.TryLock() {
		return nil
	}

	toast := widget.NewLabel(msg)
	bgRect := canvas.NewRectangle(theme.Color(theme.ColorNameBackground))
	bgRect.CornerRadius = 5
	stack := container.NewCenter(container.NewStack(bgRect, toast))
	bgRect.Resize(fyne.NewSize(10, 10))
	bgRect.Refresh()
	stack.Resize(fyne.NewSize(10, 10))
	stack.Refresh()
	Chat.container.Add(stack)
	go func() {
		time.Sleep(1 * time.Second)
		stack.Hide()
		c.toastLock.Unlock()
	}()

	return nil
}

func (c *ChatGUI) AnswerInlineQuery(_ string, _ []interface{}, _ int, _ string) error {
	return nil
}

func (c *ChatGUI) DownloadFile(_ string, _ io.Writer) (string, error) {
	return "", nil
}

func (c *ChatGUI) attachKeyboard(kb *tg.Keyboard, msgContainer *fyne.Container) {
	if kb == nil {
		return
	}

	btnCallback := func(cmd tg.Cmd) func() {
		return func() {
			c.updater(tg.NewFakeUpdCmd(1, cmd))
			c.scroll.Refresh()
			c.scroll.ScrollToBottom()
		}
	}
	for _, row := range kb.Btns {
		switch row.(type) {
		case tg.Btn:
			b := row.(tg.Btn)
			btn := newButton(b.Name, btnCallback(b.Cmd))
			msgContainer.Add(btn)
		case []tg.Btn:
			btns := row.([]tg.Btn)
			rowContainer := container.New(layout.NewGridLayoutWithColumns(len(btns)))
			for _, b := range btns {
				rowContainer.Add(newButton(b.Name, btnCallback(b.Cmd)))
			}
			msgContainer.Add(rowContainer)
		}
	}
}

func sendMsg() {
	msg := strings.TrimSpace(Chat.entry.Text)
	if len(msg) > 0 {
		if (msg[0] == '/') && (len(msg) > 1) {
			Chat.updater(tg.NewFakeUpdCmd(1, tg.NewCmd(msg[1:], nil)))
		} else {
			removeBotMessages()
			userMsg := widget.NewLabel(msg)
			userMsg.Alignment = fyne.TextAlignTrailing
			Chat.messages.Add(userMsg)
			Chat.updater(tg.NewFakeUpd(1, msg))
		}
	}
	Chat.entry.SetText("")
}

func removeBotMessages() {
	for _, msg := range Chat.removable {
		Chat.messages.Remove(msg)
	}
}

func toggleMenu() {
	y := Chat.window.Canvas().Size().Height - Chat.menu.Size().Height
	y -= Chat.entry.Size().Height
	y -= theme.Padding()
	Chat.menu.ShowAtPosition(fyne.NewPos(theme.Padding(), y))
}
