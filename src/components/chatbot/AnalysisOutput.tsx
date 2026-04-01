import React, { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AnalysisOutputProps {
  content: string;
  title?: string;
  onRestart?: () => void;
}

export const AnalysisOutput: React.FC<AnalysisOutputProps> = ({
  content,
  title,
  onRestart,
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t('chatbot.analysisResult');

  const renderMarkdown = (text: string): ReactNode => {
    const lines = text.split('\n');
    const elements: ReactNode[] = [];
    let currentList: ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        const Tag = listType;
        elements.push(
          <Tag key={`list-${elements.length}`} className={`ml-4 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1`}>
            {currentList}
          </Tag>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const text = processInline(headingMatch[2]);
        if (level === 1) {
          elements.push(<h3 key={idx} className="font-bold text-sm mt-3 mb-1">{text}</h3>);
        } else if (level === 2) {
          elements.push(<h4 key={idx} className="font-semibold text-sm mt-2 mb-1">{text}</h4>);
        } else {
          elements.push(<h5 key={idx} className="font-medium text-sm mt-2 mb-1">{text}</h5>);
        }
        return;
      }

      const listMatch = trimmed.match(/^(\*|-|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = /\d+\./.test(listMatch[1]);
        const newType = isOrdered ? 'ol' : 'ul';

        if (listType && listType !== newType) {
          flushList();
        }

        listType = newType;
        currentList.push(
          <li key={idx} className="text-sm leading-relaxed">
            {processInline(listMatch[2])}
          </li>
        );
        return;
      }

      flushList();
      elements.push(
        <p key={idx} className="text-sm leading-relaxed mb-2">
          {processInline(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  const processInline = (text: string): ReactNode => {
    const parts: ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch, idx: boldMatch.index! } : null,
        italicMatch ? { type: 'italic', match: italicMatch, idx: italicMatch.index! } : null,
      ].filter(Boolean) as Array<{ type: string; match: RegExpMatchArray; idx: number }>;

      if (matches.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const first = matches.reduce((min, curr) => curr.idx < min.idx ? curr : min);

      if (first.idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, first.idx)}</span>);
      }

      if (first.type === 'bold') {
        parts.push(<strong key={key++} className="font-semibold">{first.match[1]}</strong>);
      } else {
        parts.push(<em key={key++} className="italic">{first.match[1]}</em>);
      }

      remaining = remaining.slice(first.idx + first.match[0].length);
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-primary">{resolvedTitle}</CardTitle>
        {onRestart && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {t('chatbot.restart')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        {renderMarkdown(content)}
      </CardContent>
    </Card>
  );
};

export default AnalysisOutput;
