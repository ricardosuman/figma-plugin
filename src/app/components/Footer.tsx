import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DownloadIcon, UploadIcon } from '@primer/octicons-react';
import { useTranslation } from 'react-i18next';
import { Dispatch } from '../store';
import * as pjs from '../../../package.json';
import Box from './Box';
import Text from './Text';
import Stack from './Stack';
import BranchSelector from './BranchSelector';
import useRemoteTokens from '../store/remoteTokens';
import {
  localApiStateSelector,
  editProhibitedSelector,
  lastSyncedStateSelector,
  storageTypeSelector,
  tokensSelector,
  usedTokenSetSelector,
  themesListSelector,
  projectURLSelector,
  activeThemeSelector,
} from '@/selectors';
import DocsIcon from '@/icons/docs.svg';
import RefreshIcon from '@/icons/refresh.svg';
import FeedbackIcon from '@/icons/feedback.svg';
import IconButton from './IconButton';
import Tooltip from './Tooltip';
import { StorageProviderType } from '@/constants/StorageProviderType';
import { isGitProvider } from '@/utils/is';
import IconLibrary from '@/icons/library.svg';
import ProBadge from './ProBadge';
import { compareLastSyncedState } from '@/utils/compareLastSyncedState';
import { transformProviderName } from '@/utils/transformProviderName';

export default function Footer() {
  const [hasRemoteChange, setHasRemoteChange] = useState(false);
  const storageType = useSelector(storageTypeSelector);
  const tokens = useSelector(tokensSelector);
  const themes = useSelector(themesListSelector);
  const lastSyncedState = useSelector(lastSyncedStateSelector);
  const editProhibited = useSelector(editProhibitedSelector);
  const localApiState = useSelector(localApiStateSelector);
  const usedTokenSet = useSelector(usedTokenSetSelector);
  const dispatch = useDispatch<Dispatch>();
  const projectURL = useSelector(projectURLSelector);
  const { pullTokens, pushTokens, checkRemoteChange } = useRemoteTokens();
  const { t } = useTranslation(['footer', 'licence']);
  const activeTheme = useSelector(activeThemeSelector);

  const checkForChanges = React.useCallback(() => {
    const tokenSetOrder = Object.keys(tokens);
    const defaultMetadata = storageType.provider !== StorageProviderType.LOCAL ? { tokenSetOrder } : {};
    const hasChanged = !compareLastSyncedState(
      tokens,
      themes,
      defaultMetadata,
      lastSyncedState,
      [{}, [], defaultMetadata],
    );
    dispatch.tokenState.updateCheckForChanges(hasChanged);
    return hasChanged;
  }, [lastSyncedState, storageType, tokens, themes, dispatch.tokenState]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      checkRemoteChange().then((response: boolean) => {
        setHasRemoteChange(response);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [checkRemoteChange]);

  const hasChanges = React.useMemo(() => checkForChanges(), [checkForChanges]);

  const onPushButtonClicked = React.useCallback(() => pushTokens(), [pushTokens]);
  const onPullButtonClicked = React.useCallback(() => pullTokens({ usedTokenSet, activeTheme }), [pullTokens, usedTokenSet, activeTheme]);
  const handlePullTokens = useCallback(() => {
    pullTokens({ usedTokenSet, activeTheme });
  }, [pullTokens, usedTokenSet, activeTheme]);

  return (

    <Box
      css={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        padding: '$3',
      }}
    >

      <Stack direction="row" align="center" gap={2}>
        {isGitProvider(localApiState) && localApiState.branch && (
          <>
            <BranchSelector />
            <IconButton
              dataCy="footer-pull-button"
              badge={hasRemoteChange}
              icon={<DownloadIcon />}
              onClick={onPullButtonClicked}
              tooltipSide="top"
              tooltip={t('pullFrom', {
                provider: transformProviderName(storageType.provider),
              }) as string}
            />
            <IconButton
              dataCy="footer-push-button"
              badge={hasChanges}
              icon={<UploadIcon />}
              onClick={onPushButtonClicked}
              tooltipSide="top"
              disabled={editProhibited}
              tooltip={
              t('pushTo', {
                provider: transformProviderName(storageType.provider),
              }) as string
}
            />
          </>
        )}
        {storageType.provider === StorageProviderType.SUPERNOVA && (
          <>
            <IconButton
              dataCy="footer-pull-button"
              icon={<DownloadIcon />}
              onClick={onPullButtonClicked}
              tooltipSide="top"
              tooltip={

              t('pullFrom', {
                provider: transformProviderName(storageType.provider),
              }) as string
}
            />
            <IconButton
              dataCy="footer-push-button"
              badge={hasChanges}
              icon={<UploadIcon />}
              onClick={onPushButtonClicked}
              tooltipSide="top"
              disabled={editProhibited}
              tooltip={
                 t('pushTo', {
                   provider: transformProviderName(storageType.provider),
                 }) as string
}
            />
          </>
        )}
        {storageType.provider !== StorageProviderType.LOCAL
          && storageType.provider !== StorageProviderType.GITHUB
          && storageType.provider !== StorageProviderType.GITLAB
          && storageType.provider !== StorageProviderType.ADO
          && storageType.provider !== StorageProviderType.BITBUCKET
          && storageType.provider !== StorageProviderType.SUPERNOVA
          ? (
            <Stack align="center" direction="row" gap={2}>
              <Text muted>{t('sync')}</Text>
              {storageType.provider === StorageProviderType.JSONBIN && (
                <Tooltip label={t('goTo', {
                  provider: transformProviderName(storageType.provider),
                }) as string}
                >
                  <IconButton icon={<IconLibrary />} href={projectURL} />
                </Tooltip>
              )}
              <IconButton
                tooltip={t('pullFrom', {
                  provider: transformProviderName(storageType.provider),
                }) as string}
                onClick={handlePullTokens}
                icon={<RefreshIcon />}
              />
            </Stack>
          ) : null}
      </Stack>
      <Stack direction="row" gap={4} align="center">
        <Box css={{ color: '$textMuted', fontSize: '$xsmall' }}>
          <a href="https://tokens.studio/changelog" target="_blank" rel="noreferrer">{`V ${pjs.version}`}</a>
        </Box>
        <Stack direction="row" gap={1}>
          <ProBadge />
          <IconButton href="https://docs.tokens.studio/?ref=pf" icon={<DocsIcon />} tooltip={t('docs') as string} />
          <IconButton href="https://github.com/tokens-studio/figma-plugin" icon={<FeedbackIcon />} tooltip={t('feedback') as string} />
        </Stack>
      </Stack>

    </Box>
  );
}
