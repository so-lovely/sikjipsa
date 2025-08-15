package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

var Log *logrus.Logger

func init() {
	Log = logrus.New()
	
	// Set output to stdout
	Log.SetOutput(os.Stdout)
	
	// Set log level based on environment
	env := os.Getenv("ENV")
	if env == "production" {
		Log.SetLevel(logrus.InfoLevel)
		Log.SetFormatter(&logrus.JSONFormatter{})
	} else {
		Log.SetLevel(logrus.DebugLevel)
		Log.SetFormatter(&logrus.TextFormatter{
			ForceColors:   true,
			FullTimestamp: true,
		})
	}
}

// Info logs info level messages
func Info(args ...interface{}) {
	Log.Info(args...)
}

// Infof logs formatted info level messages
func Infof(format string, args ...interface{}) {
	Log.Infof(format, args...)
}

// Debug logs debug level messages (only in development)
func Debug(args ...interface{}) {
	Log.Debug(args...)
}

// Debugf logs formatted debug level messages (only in development)
func Debugf(format string, args ...interface{}) {
	Log.Debugf(format, args...)
}

// Warn logs warning level messages
func Warn(args ...interface{}) {
	Log.Warn(args...)
}

// Warnf logs formatted warning level messages
func Warnf(format string, args ...interface{}) {
	Log.Warnf(format, args...)
}

// Error logs error level messages
func Error(args ...interface{}) {
	Log.Error(args...)
}

// Errorf logs formatted error level messages
func Errorf(format string, args ...interface{}) {
	Log.Errorf(format, args...)
}

// Fatal logs fatal level messages and exits
func Fatal(args ...interface{}) {
	Log.Fatal(args...)
}

// Fatalf logs formatted fatal level messages and exits
func Fatalf(format string, args ...interface{}) {
	Log.Fatalf(format, args...)
}

// WithFields creates a log entry with fields
func WithFields(fields logrus.Fields) *logrus.Entry {
	return Log.WithFields(fields)
}

// WithField creates a log entry with a single field
func WithField(key string, value interface{}) *logrus.Entry {
	return Log.WithField(key, value)
}