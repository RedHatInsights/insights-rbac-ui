import React from 'react';
import PropTypes from 'prop-types';

import { Stack, StackItem, Title, Popover, Button } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

import './pageSection.scss';

const MUAPageSection = ({ title, children, popOverContent }) => {
    return (
        <section className='ins-l-myUserAccess-section'>
            <Stack hasGutter>
                <StackItem>
                    <Title headingLevel="h2" size="2xl">
                        { title }
                        { popOverContent &&
                            <Popover
                                bodyContent={ <div> { popOverContent } </div> }
                                aria-label={ popOverContent }
                                closeBtnAriaLabel="Close popover"
                                position='right'>
                                <Button variant='plain'><OutlinedQuestionCircleIcon size='sm'/></Button>
                            </Popover>
                        }
                    </Title>
                </StackItem>
                <StackItem> { children } </StackItem>
            </Stack>
        </section>
    );
};

MUAPageSection.propTypes = {
    title: PropTypes.node,
    children: PropTypes.any,
    popOverContent: PropTypes.string
  };

export default MUAPageSection;
